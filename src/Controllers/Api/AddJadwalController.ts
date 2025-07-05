import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { NextFunction, Request, Response, Router } from "express";
import { check, ValidationChain, validationResult } from "express-validator";
import { PrismaClient, Hari, Role } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router = Router();

class AddJadwalController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.post(
      "/jadwal",
      this.validator(),
      this.addJadwal.bind(this)
    );
  }
  private toTimeOnlyDate(jam: string): Date {
    const [hour, minute] = jam.split(":").map(Number);
    return new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
  }
  private async addJadwal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { id_kelas, id_guru, id_ruang, hari, jam_mulai, jam_selesai } =
      req.body;

    const authHeader = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(
      authHeader as string,
      this.privateKey
    ) as JwtPayload;

    if (decoded.role !== "admin" && decoded.role !== "super_admin") {
      res.status(403).json({
        status: false,
        message: "Access denied: Only admin can create schedule.",
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

    try {
      const jamMulaiDate = this.toTimeOnlyDate(jam_mulai);
      const jamSelesaiDate = this.toTimeOnlyDate(jam_selesai);

      if (jamSelesaiDate <= jamMulaiDate) {
        res.status(400).json({
          status: false,
          message: "jam_selesai harus lebih besar dari jam_mulai.",
        });
        return;
      }
      const existingJadwal = await this.jadwal.findFirst({
        where: {
          id_kelas,
          id_guru,
          id_ruang,
          hari,
          jam_mulai: jamMulaiDate,
          jam_selesai: jamSelesaiDate,
        },
      });

      if (existingJadwal) {
        res.status(409).json({
          status: false,
          message: "Schedule already exists with the same data.",
        });
        return;
      }

      const kelas = await this.kelas.findUnique({
        where: { id_kelas },
      });
      if (!kelas) {
        res.status(404).json({
          status: false,
          message: `Kelas dengan id ${id_kelas} tidak ditemukan.`,
        });
        return;
      }

      const guru = await this.guru.findUnique({
        where: { id_guru },
      });
      if (!guru) {
        res.status(404).json({
          status: false,
          message: `Guru dengan id ${id_guru} tidak ditemukan.`,
        });
        return;
      }

      const ruang_Kelas = await this.ruang_Kelas.findUnique({
        where: { id_ruang },
      });
      if (!ruang_Kelas) {
        res.status(404).json({
          status: false,
          message: `Ruang Kelas dengan id ${id_ruang} tidak ditemukan.`,
        });
        return;
      }

      const newJadwal = await this.jadwal.create({
        data: {
          id_kelas,
          id_guru,
          id_ruang,
          hari,
          jam_mulai: jamMulaiDate,
          jam_selesai: jamSelesaiDate,
        },
      });

      res.status(201).json({
        status: true,
        message: "Schedule and presensi created successfully.",
        data: newJadwal,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        message: "Internal server error.",
        error: (error as Error).message,
      });
    }
  }

  private validator(): ValidationChain[] {
    return [
      check("id_kelas").notEmpty().withMessage("id_kelas is required.").isInt(),
      check("id_guru").notEmpty().withMessage("id_guru is required.").isInt(),
      check("id_ruang").notEmpty().withMessage("id_ruang is required.").isInt(),
      check("hari")
        .notEmpty()
        .withMessage("hari is required.")
        .isIn(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"])
        .withMessage("hari must be one of: Senin - Jumat."),
      check("jam_mulai")
        .notEmpty()
        .withMessage("jam_mulai is required.")
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage("jam_mulai must be in HH:mm format."),
      check("jam_selesai")
        .notEmpty()
        .withMessage("jam_selesai is required.")
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage("jam_selesai must be in HH:mm format."),
    ];
  }
}

export default AddJadwalController;
