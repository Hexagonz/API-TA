import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { Prisma, PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import { check, ValidationChain, validationResult } from "express-validator";
import bcrypt from "bcryptjs";

const router = Router();

class EditUsersController extends AuthMiddleWare {
  private edituser: Prisma.UsersCreateInput;

  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.edituser = {
      username: "",
      name: "",
      password: "",
      role: undefined,
    };
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.post(
      "/users",
      this.validator(),
      this.addUsers.bind(this)
    );
  }

  private async addUsers(
    req: Request<{
      username: string;
      name: string;
      password: string;
      role: string;
    }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { username, name, password, role } = req.body;
    const authHeader = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(
      authHeader as string,
      this.privateKey
    ) as JwtPayload;
    if (decoded.role !== "admin") {
      res.status(403).json({
        status: false,
        message: "Akses ditolak: Hanya admin yang bisa edit data user",
      });
      return;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors: Array<{ param: string; msg: string }> = errors
        .array()
        .map((error) => ({
          param: (error as any).path,
          msg: (error as any).msg,
        }));

      res.status(400).json({
        status: false,
        errors: validationErrors.map((err) => ({
          field: err.param,
          message: err.msg,
        })),
      });
      return;
    }
    try {
      let existingUser = await this.users.findUnique({
        where: {
          username,
        },
      });

      if (existingUser) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        this.edituser = {
          username,
          name,
          password: password == existingUser.password ? existingUser.password : hash,
          role,
        };
        await this.users.update({
          where: {
            username,
          },
          data: this.edituser,
        });

        res.status(200).json({
          status: true,
          data: this.edituser,
          message: "User updated successfully...",
        });
      } else {
        res.status(409).json({
          success: false,
          message: `Username ${username} tidak ditemukan`,
        });
        return;
      }
      return;
    } catch (err) {
      console.log(err);
      res.status(500).json({
        status: false,
        message: "Internal Server Error",
      });
    }
  }
  private validator(): ValidationChain[] {
    return [
      check("username")
        .notEmpty()
        .withMessage("field username cannot be empty!")
        .isLength({ min: 8, max: 20 })
        .withMessage("Username must be between 8 and 20 characters")
        .matches(/^(?![_ -])(?:(?![_ -]{2})[\w -]){8,20}(?<![_ -])$/)
        .withMessage("Unique characters are not allowed!"),
      check("name")
        .notEmpty()
        .withMessage("field name cannot be empty!")
        .isLength({ min: 4, max: 50 })
        .withMessage("Username must be between 4 and 50 characters")
        .matches(/^(?![_ -])(?:(?![_ -]{2})[\w -]){4,50}(?<![_ -])$/)
        .withMessage("Unique characters are not allowed!"),
      check("role")
        .notEmpty()
        .withMessage("Field role cannot be empty!")
        .isIn(["admin", "siswa", "guru"])
        .withMessage("Invalid role value!"),
      check("password")
        .notEmpty()
        .withMessage("field password cannot be empty!")
        .bail()
        .isLength({ min: 8 })
        .withMessage("Password must be between 8 and 30 characters"),
      check("password_confirmation")
        .notEmpty()
        .withMessage("field confirmation_password cannot be empty!")
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(
              "Password confirmation does not match with password"
            );
          }
          return true;
        }),
    ];
  }
}

export default EditUsersController;
