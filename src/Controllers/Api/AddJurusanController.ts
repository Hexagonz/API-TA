import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import { check, ValidationChain, validationResult } from "express-validator";

const router = Router();
class AddJurusanController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.post(
      "/jurusan",
      this.validator(),
      this.addJurusan.bind(this)
    );
  }

  private async addJurusan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { nama_jurusan, deskripsi } = req.body;
    const authHeader = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(
      authHeader as string,
      this.privateKey
    ) as JwtPayload;
    if (decoded.role !== "admin") {
      res.status(403).json({
        status: false,
        message: "Akses ditolak: Hanya admin yang bisa melihat data user",
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
      const existingJurusan = await this.jurusan.findFirst({
        where: {
          nama_jurusan: nama_jurusan,
        },
      });

      if (existingJurusan) {
        res.status(404).json({
          status: false,
          message: `Jurusan ${existingJurusan.nama_jurusan} already exists`,
          data: null,
        });
        return;
      }
      const create = await this.jurusan.create({
        data: {
          nama_jurusan: nama_jurusan,
          deskripsi: deskripsi,
        },
      });

      res.status(200).json({
        status: true,
        message: "Jurusan created successfully...",
        data: create,
      });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        message: "Terjadi kesalahan pada server",
        error: (error as Error).message,
      });
      return;
    }
  }

  private validator(): ValidationChain[] {
    return [
      check("nama_jurusan")
        .notEmpty()
        .withMessage("field nama_jurusan cannot be empty!")
        .isLength({ min: 2, max: 10 })
        .withMessage("Jurusan must be between 2 and 10 characters")
        .matches(/^(?![_-])(?!.*[_-]{2})(?!.*[^a-zA-Z0-9 _-]).*(?<![_-])$/)
        .withMessage("Unique characters are not allowed!"),
      check("deskripsi")
        .notEmpty()
        .withMessage("field deskripsi cannot be empty!")
        .isLength({ min: 4, max: 50 })
        .withMessage("Deskripsi must be between 4 and 50 characters")
        .matches(/^(?![_-])(?!.*[_-]{2})(?!.*[^a-zA-Z0-9 _-]).*(?<![_-])$/)
        .withMessage("Unique characters are not allowed!"),
    ];
  }
}

export default AddJurusanController;
