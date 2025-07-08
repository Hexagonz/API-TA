import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import AuthMiddleWare from "@/middleware/AuthMiddleware";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router = Router();

class GetPresensiByJadwalController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.get(
      "/presensi/jadwal/:id_jadwal",
      this.getPresensiByJadwal.bind(this)
    );
  }

  private async getPresensiByJadwal(
    req: Request,
    res: Response
  ): Promise<void> {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ status: false, message: "Token tidak ditemukan" });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, this.privateKey) as JwtPayload;
    } catch (err) {
      res.status(401).json({ status: false, message: "Token tidak valid" });
      return;
    }

    if (decoded.role !== "guru") {
      res.status(403).json({
        status: false,
        message: "Hanya guru yang bisa mengakses data presensi",
      });
      return;
    }

    const { id_jadwal } = req.params;

    try {
      const jadwal = await this.jadwal.findUnique({
        where: { id_jadwal: Number(id_jadwal) },
        include: {
          guru: true,
          kelas: true,
          ruang: {
            include: {
              jurusan: true,
            },
          },
        },
      });

      if (!jadwal || jadwal.guru.nip !== decoded.username) {
        res.status(404).json({
          status: false,
          message: "Jadwal tidak ditemukan atau bukan milik guru ini",
        });
        return;
      }

      const presensi = await this.presensi.findMany({
        where: {
          id_jadwal: Number(id_jadwal),
          jadwal: {
            id_kelas: jadwal.id_kelas,
            id_ruang: jadwal.id_ruang,
            ruang: {
              id_jurusan: jadwal.ruang.id_jurusan,
            },
          },
        },
        include: {
          siswa: true,
          jadwal: {
            include: {
              guru: true,
              kelas: true,
              ruang: {
                include: {
                  jurusan: true,
                },
              },
            },
          },
        },
        orderBy: { tanggal: "desc" },
      });

      if (presensi.length === 0) {
        res.status(404).json({
          status: false,
          message: "Presensi tidak ditemukan untuk jadwal ini",
          data: [],
        });
        return;
      }

      res.status(200).json({
        status: true,
        message: "Data presensi berhasil diambil berdasarkan jadwal dan filter kelas, ruang, jurusan",
        data: presensi,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: false,
        message: "Terjadi kesalahan saat mengambil data presensi",
        error: (err as Error).message,
      });
    }
  }
}

export default GetPresensiByJadwalController;
