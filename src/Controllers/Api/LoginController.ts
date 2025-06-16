import { NextFunction, Request, Response, Router } from "express";
import { check, ValidationChain, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";

class LoginController extends PrismaClient {
  public router: Router;

  constructor() {
    super();
    this.router = Router();
    this.initializeRoutes();
  }

  private readonly privateKey = fs.readFileSync("./lib/private.key", "utf-8");

  private readonly refreshKey = fs.readFileSync(
    "./lib/privateRefresh.pem",
    "utf-8"
  );

  private initializeRoutes() {
    this.router.post("/login", this.validator(), this.login.bind(this));
  }

  private async login(
    req: Request<{ username: string; password: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { username, password } = req.body;
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

    let existingUser;
    try {
      existingUser = await this.users.findUnique({
        where: {
          username,
        },
      });
    } catch {
      const error = new Error("Error! Something went wrong.");
      return next(error);
    }
    if (!existingUser) {
      res.status(422).json({
        success: false,
        message: "Username atau Password Salah",
      });
      return;
    }
    let comparePassword = bcrypt.compareSync(password, existingUser?.password);
    if (!comparePassword) {
      res.status(422).json({
        status: false,
        message: "Username atau Password Salah",
      });
      return;
    }

    let token;
    let refreshToken;

    try {
      token = jwt.sign(
        {
          id_user: existingUser?.id,
          role: existingUser?.role,
          username: existingUser?.username,
        },
        this.privateKey,
        { expiresIn: "15m", algorithm: "RS256" }
      );

      refreshToken = jwt.sign(
        {
          id_user: existingUser?.id,
          role: existingUser?.role,
          username: existingUser?.username,
        },
        this.refreshKey,
        { expiresIn: "1h", algorithm: "ES256" }
      );

      await this.refresh_Token.upsert({
        where: { id_user: existingUser.id },
        update: {
          token: refreshToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        create: {
          id_user: existingUser.id,
          token: refreshToken as string,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
    } catch (err) {
      res.status(401).json({
        status: false,
        message: "Unauthorized gagal membuat token",
      });
      return;
    }
    res.status(201).json({
      status: true,
      data: {
        userId: existingUser.id,
        username: existingUser.username,
        role: existingUser.role,
        accses_token: token,
        refresh_token: refreshToken,
      },
      message: "Login Succses...",
    });
    return;
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
      check("password")
        .notEmpty()
        .withMessage("field password cannot be empty!")
        .isLength({ min: 8 })
        .withMessage("Password must be between 8 and 30 characters"),
    ];
  }
}

export default LoginController;
