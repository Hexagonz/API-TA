import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import { check, ValidationChain, validationResult } from "express-validator";

const router = Router();
class AddKelasController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.post(
      "/kelas",
      this.validator(),
      this.addKelas.bind(this)
    );
  }

  private async addKelas(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { nama_kelas, kelas_romawi } = req.body;
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
      const existingKelas = await this.kelas.findFirst({
        where: {
          nama_kelas: nama_kelas,
        },
      });

      if (existingKelas) {
        res.status(404).json({
          status: false,
          message: `Kelas ${existingKelas.nama_kelas} already exists`,
          data: null,
        });
        return;
      }
      const create = await this.kelas.create({
        data: {
          nama_kelas: nama_kelas,
          kelas_romawi: kelas_romawi,
        },
      });
      res.status(200).json({
        status: true,
        message: "Kelas created successfully...",
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
      check("nama_kelas")
        .notEmpty()
        .withMessage("field nama_kelas cannot be empty!")
        .isLength({ min: 1, max: 5 })
        .withMessage("nama_kelas must be between 1 and 5 characters")
        .matches(/^(?![_-])(?!.*[_-]{2})(?!.*[^a-zA-Z0-9 _-]).*(?<![_-])$/)
        .withMessage("Unique characters are not allowed!"),
      check("kelas_romawi")
        .notEmpty()
        .withMessage("field kelas_romawi cannot be empty!")
        .isLength({ min: 1, max: 5 })
        .withMessage("kelas_romawi must be between 1 and 5 characters")
        .withMessage("Unique characters are not allowed!"),
    ];
  }
}

export default AddKelasController;
