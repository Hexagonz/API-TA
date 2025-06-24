import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router = Router();

class GetRuanganController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.get("/ruang-kelas", this.getRuangKelas.bind(this));
  }

  private async getRuangKelas(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const authHeader = req.headers.authorization?.split(" ")[1];

    try {
      const decoded = jwt.verify(
        authHeader as string,
        this.privateKey
      ) as JwtPayload;

      if (decoded.role !== "admin" && decoded.role !== "super_admin") {
        res.status(403).json({
          status: false,
          message: "Akses ditolak: Hanya admin yang bisa melihat data ruang kelas",
        });
        return;
      }

      const existingRuangan = await this.ruang_Kelas.findMany({
        include: { jurusan: true },
      });

      if (!existingRuangan || existingRuangan.length === 0) {
        res.status(404).json({
          status: false,
          message: "Tidak ada ruang kelas ditemukan",
          data: [],
        });
        return;
      }

      res.status(200).json({
        status: true,
        message: "Berhasil mengambil data ruang kelas",
        data: existingRuangan,
      });
    } catch (error) {
      console.error("Gagal mengambil ruang kelas:", error);
      res.status(500).json({
        status: false,
        message: "Terjadi kesalahan pada server",
        error: (error as Error).message,
      });
    }
  }
}

export default GetRuanganController;
