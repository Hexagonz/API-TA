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
    this.protectedRouter.post("/presensi/prepare", this.preparePresensi.bind(this));
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
      res.status(403).json({ status: false, message: "Only teachers can prepare presensi." });
      return;
    }

    // Konversi hari lokal ke enum Prisma
    const namaHari = new Date().toLocaleDateString("id-ID", { weekday: "long" });
    const hariEnum = namaHari.toUpperCase() as keyof typeof $Enums.Hari;

    const tanggalHariIni = new Date();

    try {
      // 1. Ambil semua jadwal hari ini milik guru
      const jadwalHariIni = await this.jadwal.findMany({
        where: {
          id_guru: decoded.id,
          hari: $Enums.Hari[hariEnum], // pastikan enum cocok
        },
      });

      let totalPresensiBaru = 0;

      for (const jadwal of jadwalHariIni) {
        // 2. Ambil data ruang dari jadwal
        const ruang = await this.ruang_Kelas.findUnique({
          where: { id_ruang: jadwal.id_kelas },
        });

        if (!ruang) continue;

        const siswaKelas = await this.siswa.findMany({
          where: { id_kelas: jadwal.id_kelas },
        });

        for (const siswa of siswaKelas) {
          const existingPresensi = await this.presensi.findFirst({
            where: {
              id_siswa: siswa.id_siswa,
              id_jadwal: jadwal.id_jadwal,
              tanggal: {
                gte: new Date(tanggalHariIni.setHours(0, 0, 0, 0)),
                lte: new Date(tanggalHariIni.setHours(23, 59, 59, 999)),
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
                status: false,
                gambar: "",
                keterangan: "",
              },
            });
            totalPresensiBaru++;
          }
        }
      }

      res.status(200).json({
        status: true,
        message: `Presensi generated successfully for today.`,
        data: { count: totalPresensiBaru },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: false,
        message: "Server error",
        error: (err as Error).message,
      });
    }
  }
}

export default PreparePresensiController;
