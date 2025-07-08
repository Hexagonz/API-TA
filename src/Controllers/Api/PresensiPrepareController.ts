import { Request, Response, Router } from "express";
import { PrismaClient, $Enums } from "@prisma/client";
import AuthMiddleWare from "@/middleware/AuthMiddleware";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router = Router();

class PreparePresensiController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.post(
      "/presensi/prepare",
      this.preparePresensi.bind(this)
    );
  }

  private async preparePresensi(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization?.split(" ")[1];
    if (!authHeader) {
      res.status(401).json({ status: false, message: "Token tidak ditemukan" });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(authHeader, this.privateKey) as JwtPayload;
    } catch (err) {
      res.status(401).json({ status: false, message: "Token tidak valid" });
      return;
    }

    if (decoded.role !== "guru") {
      res
        .status(403)
        .json({
          status: false,
          message: "Hanya guru yang bisa mengatur presensi",
        });
      return;
    }

    const { id_jadwal } = req.body;
    if (!id_jadwal) {
      res.status(400).json({ status: false, message: "id_jadwal diperlukan" });
      return;
    }

    const tanggalSekarang = new Date();

    // Format jam dan tanggal Indonesia (opsional jika mau tampilkan)
    const jamIndo = tanggalSekarang.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const tanggalIndo = tanggalSekarang.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    try {
      const jadwal = await this.jadwal.findUnique({
        where: { id_jadwal },
        include : {
          guru: true
        },
      });
      if (!jadwal || jadwal.guru.nip !== decoded.username) {
        res
          .status(404)
          .json({
            status: false,
            message: "Jadwal tidak ditemukan atau bukan milik guru ini",
          });
        return;
      }

      const siswaKelas = await this.siswa.findMany({
        where: { id_kelas: jadwal.id_kelas },
      });

      let totalPresensiBaru = 0;

      for (const siswa of siswaKelas) {
        const existingPresensi = await this.presensi.findFirst({
          where: {
            id_siswa: siswa.id_siswa,
            id_jadwal: jadwal.id_jadwal,
            tanggal: {
              gte: new Date(tanggalSekarang.setHours(0, 0, 0, 0)),
              lte: new Date(tanggalSekarang.setHours(23, 59, 59, 999)),
            },
          },
        });

        if (!existingPresensi) {
          await this.presensi.create({
            data: {
              id_siswa: siswa.id_siswa,
              id_jadwal: jadwal.id_jadwal,
              hari: jadwal.hari,
              tanggal: new Date(), 
              status: undefined,
              gambar: "",
              keterangan: "",
              progres: "idle"
            },
          });
          totalPresensiBaru++;
        }
      }

      res.status(200).json({
        status: true,
        message: `Presensi berhasil disiapkan pada ${tanggalIndo} jam ${jamIndo}.`,
        data: { count: totalPresensiBaru },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: false,
        message: "Terjadi kesalahan server",
        error: (err as Error).message,
      });
    }
  }
}

export default PreparePresensiController;
