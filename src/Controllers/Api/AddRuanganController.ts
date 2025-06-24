import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import { check, ValidationChain, validationResult } from "express-validator";

const router = Router();

class AddRuanganController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.post(
      "/ruang-kelas",
      this.validator(),
      this.addRuangan.bind(this)
    );
  }

  private async addRuangan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { nomor_ruang, id_jurusan } = req.body;
    const authHeader = req.headers.authorization?.split(" ")[1];

    try {
      const decoded = jwt.verify(
        authHeader as string,
        this.privateKey
      ) as JwtPayload;

      if (decoded.role !== "admin" && decoded.role !== "super_admin") {
        res.status(403).json({
          status: false,
          message: "Akses ditolak: Hanya admin yang bisa menambah data ruang_Kelas",
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
      const existingRuangan = await this.ruang_Kelas.findFirst({
        where: {
          nomor_ruang: Number(nomor_ruang),
          id_jurusan: Number(id_jurusan),
        },
      });

      if (existingRuangan) {
        res.status(409).json({
          status: false,
          message: `Ruangan nomor ${nomor_ruang} untuk jurusan tersebut sudah terdaftar`,
          data: null,
        });
        return;
      }

      const existingJurusan = await this.jurusan.findFirst({
        where: { id_jurusan: id_jurusan },
      });

      if (!existingJurusan) {
        res.status(400).json({
          status: false,
          message: `ID jurusan ${id_jurusan} tidak ditemukan`,
          data: null,
        });
        return;
      }

      // ✅ Simpan ruangan
      const create = await this.ruang_Kelas.create({
        data: {
          nomor_ruang: Number(nomor_ruang),
          id_jurusan: Number(id_jurusan),
        },
      });

      res.status(201).json({
        status: true,
        message: "Ruangan berhasil ditambahkan",
        data: create,
      });
    } catch (error) {
      console.error("Error saat menambahkan ruang_Kelas:", error);
      res.status(500).json({
        status: false,
        message: "Terjadi kesalahan pada server",
        error: (error as Error).message,
      });
    }
  }

  private validator(): ValidationChain[] {
    return [
      check("nomor_ruang")
        .notEmpty()
        .withMessage("Field nomor_ruang tidak boleh kosong!")
        .isInt({ min: 1, max: 255 })
        .withMessage("nomor_ruang harus berupa angka antara 1 sampai 255"),
      check("id_jurusan")
        .notEmpty()
        .withMessage("Field id_jurusan tidak boleh kosong!")
        .isNumeric()
        .withMessage("Field id_jurusan harus berupa angka!"),
    ];
  }
}

export default AddRuanganController;
