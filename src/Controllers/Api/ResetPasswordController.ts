import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { NextFunction, Request, Response, Router } from "express";
import { check, ValidationChain, validationResult } from "express-validator";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";
import { Prisma } from "@prisma/client";

const router: Router = Router();

class ResetPasswordController extends AuthMiddleWare {
  private user: Prisma.UsersUpdateInput;
  constructor() {
    super(router);
    this.user = {
      username: "",
      password: "",
    };
    this.initializeRoutes();
  }

  private readonly publicKey = fs.readFileSync("./lib/public.key", "utf-8");

  private initializeRoutes(): void {
    this.protectedRouter.post(
      "/reset-password",
      this.validator(),
      this.resetPassword.bind(this)
    );
    this.protectedRouter.post(
      "/request-reset-password",
      this.requestResetPassword.bind(this)
    );
  }

  private async resetPassword(
    req: Request<{}, {}, { password: string; token: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { password, token } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const validationErrors = errors.array().map((error) => ({
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
      const passwordToken = jwt.verify(
        token,
        fs.readFileSync("./lib/key-password/public.key", "utf-8"),
        { algorithms: ["RS256"] } 
      ) as JwtPayload;

      const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));

      this.user = {
        username: passwordToken.username,
        password: hash,
      };

      const data = await this.users.update({
        where: { username: passwordToken.username },
        data: this.user,
      });

      res.status(201).json({
        status: true,
        data,
        message: "Success Reset Password User...",
      });
    } catch (err) {
      res.status(400).json({
        status: false,
        errors: {
          message: "Request data is missing. Token is invalid or expired",
        },
      });
      return next(err);
    }
  }

  private async requestResetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    let token = req.headers.authorization?.split(" ")[1];
    let reqToken;
    try {
      const decodedToken = jwt.verify(
        token as string,
        this.publicKey
      ) as JwtPayload;
      reqToken = jwt.sign(
        {
          id_user: decodedToken.id_user,
          username: decodedToken.username,
          role: decodedToken.role,
        },
        fs.readFileSync("./lib/key-password/private.key", "utf-8"),
        { expiresIn: "1h", algorithm: "RS256" }
      );
      res.status(201).json({
        status: true,
        data: {
          token: reqToken,
        },
        message: "Succses Created Password reset token...",
      });
    } catch (err) {
      res.status(400).json({
        status: false,
        errors: {
          message: "Invalid or expired token...",
        },
      });
      return next(err);
    }
  }

  private validator(): ValidationChain[] {
    return [
      check("token").notEmpty().withMessage("field token cannot be empty!"),
      check("password")
        .notEmpty()
        .withMessage("field password cannot be empty!")
        .bail()
        .isLength({ min: 8, max: 30 })
        .withMessage("Password must be between 8 and 30 characters"),
      check("password_confirmation")
        .notEmpty()
        .withMessage("field password_confirmation cannot be empty!")
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

export default ResetPasswordController;
