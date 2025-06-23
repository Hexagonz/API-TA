import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import { check, ValidationChain, validationResult } from "express-validator";

const router = Router();
class AddGuruController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.post(
      "/guru",
      this.validator(),
      this.addGuru.bind(this)
    );
  }

  private async addGuru(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { nama_guru, nip, id_mapel } = req.body;
    const authHeader = req.headers.authorization?.split(" ")[1];

    try {
      const decoded = jwt.verify(
        authHeader as string,
        this.privateKey
      ) as JwtPayload;
      if (decoded.role !== "admin") {
        res.status(403).json({
          status: false,
          message: "Akses ditolak: Hanya admin yang bisa menambah data guru",
        });
        return;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().map((error) => ({
          field: (error as any).path,
          message: (error as any).msg,
        }));
        res.status(400).json({ status: false, errors: validationErrors });
        return;
      }

      const existingGuru = await this.guru.findFirst({ where: { nip } });
      if (existingGuru) {
        res.status(409).json({
          status: false,
          message: `NIP Guru ${nip} sudah terdaftar`,
          data: null,
        });
        return;
      }

      const existingMapel = await this.mata_Pelajaran.findUnique({
        where: { id_mapel: Number(id_mapel) },
      });

      if (!existingMapel) {
        res.status(400).json({
          status: false,
          message: `ID Mapel ${id_mapel} tidak ditemukan`,
          data: null,
        });
        return;
      }

      // Simpan data guru baru
      const create = await this.guru.create({
        data: {
          nama_guru,
          nip,
          id_mapel,
        },
      });

      res.status(201).json({
        status: true,
        message: "Guru berhasil ditambahkan",
        data: create,
      });
    } catch (error) {
      console.error("Error saat menambahkan guru:", error);
      res.status(500).json({
        status: false,
        message: "Terjadi kesalahan pada server",
        error: (error as Error).message,
      });
    }
  }

  private validator(): ValidationChain[] {
    return [
      check("nama_guru")
        .notEmpty()
        .withMessage("field nama_guru cannot be empty!")
        .isLength({ min: 3, max: 60 })
        .withMessage("nama_guru must be between 3 and 60 characters")
        .matches(/^(?![_-])(?!.*[_-]{2})(?!.*[^a-zA-Z0-9 _\-.,]).*(?<![_-])$/)
        .withMessage("Unique characters are not allowed!"),
      check("nip")
        .notEmpty()
        .withMessage("field nip cannot be empty!")
        .isLength({ min: 8, max: 15 })
        .withMessage("nip must be between 8 and 15 characters")
        .matches(/^(?![_-])(?!.*[_-]{2})(?!.*[^a-zA-Z0-9 _\-.,]).*(?<![_-])$/)
        .withMessage("Unique characters are not allowed!"),
      check("id_mapel")
        .notEmpty()
        .withMessage("Field id_mapel cannot be empty!")
        .isNumeric()
        .withMessage("Field id_mapel must be a number!"),
    ];
  }
}

export default AddGuruController;
