import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import AuthMiddleWare from "@/middleware/AuthMiddleware";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router = Router();

class PreparePresensiController extends AuthMiddleWare {
  private readonly prisma = new PrismaClient();
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
    const decoded = jwt.verify(authHeader as string, this.privateKey) as JwtPayload;

    if (decoded.role !== "guru") {
      res.status(403).json({ status: false, message: "Only teachers can prepare presensi." });
      return;
    }

    const hariIni = new Date().toLocaleDateString("id-ID", { weekday: "long" }) as any; // 'Senin', 'Selasa', ...
    const tanggalHariIni = new Date();

    try {
      // 1. Ambil semua jadwal hari ini milik guru ini
      const jadwalHariIni = await this.prisma.jadwal.findMany({
        where: {
          id_guru: decoded.id,
          hari: hariIni,
        },
      });

      let totalPresensiBaru = 0;

      for (const jadwal of jadwalHariIni) {
        const siswaKelas = await this.prisma.siswa.findMany({
          where: {
            id_kelas: jadwal.id_kelas,
          },
        });

        for (const siswa of siswaKelas) {
          const presensiExist = await this.prisma.presensi.findFirst({
            where: {
              id_siswa: siswa.id_siswa,
              id_jadwal: jadwal.id_jadwal,
              tanggal: {
                gte: new Date(tanggalHariIni.setHours(0, 0, 0, 0)),
                lte: new Date(tanggalHariIni.setHours(23, 59, 59, 999)),
              },
            },
          });

          if (!presensiExist) {
            await this.prisma.presensi.create({
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
      res.status(500).json({ status: false, message: "Server error", error: (err as Error).message });
    }
  }
}

export default PreparePresensiController;
