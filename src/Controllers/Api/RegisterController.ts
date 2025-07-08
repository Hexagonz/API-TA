import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import { check, ValidationChain, validationResult } from "express-validator";
import { PrismaClient, Prisma } from "@prisma/client";

class RegisterController extends PrismaClient {
  public router: Router;
  private user: Prisma.UsersCreateInput;

  constructor() {
    super();
    this.router = Router();
    this.user = {
      username: "",
      name: "",
      password: "",
      role: "admin",
    };
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/register", this.validator(), this.register.bind(this));
  }

  private async register(
    req: Request<{
      username: string;
      name: string;
      password: string;
      role: string;
    }>,
    res: Response
  ): Promise<void> {
    const { username, name, password, role } = req.body;
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

      if (!existingUser) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        this.user = {
          username,
          name,
          password: hash,
          role,
        };
        await this.users.create({ data: this.user });

        res.status(201).json({
          status: true,
          data: this.user,
          message: "User created successfully...",
        });
      } else {
        if (existingUser.username === username) {
          res.status(409).json({
            success: false,
            message: `Username ${username} already exists`,
          });
          return;
        }
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
        .matches(/^(?![_-])(?!.*[_-]{2})(?!.*[^a-zA-Z0-9 _\-.,]).*(?<![_-])$/)
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

export default RegisterController;
