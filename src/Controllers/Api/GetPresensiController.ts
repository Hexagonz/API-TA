import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import AuthMiddleWare from "@/middleware/AuthMiddleware";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router = Router();

class GetPresensiController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.get("/presensi", this.getAllPresensi.bind(this));
  }

  private async getAllPresensi(req: Request, res: Response): Promise<void> {
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

    try {
      const presensi = await this.presensi.findMany({
        include: {
          siswa: {
            include: {
                jurusan: true
            }
          },
          jadwal: {
            include: {
              kelas: true,
              ruang: true,
              guru: {
                include: {
                  mapel: true,
                },
              },
            },
          },
        },
        orderBy: { tanggal: "desc" },
      });

      res.status(200).json({
        status: true,
        message: "Data presensi berhasil diambil",
        data: presensi,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: false,
        message: "Gagal mengambil data presensi",
        error: (err as Error).message,
      });
    }
  }
}

export default GetPresensiController;
