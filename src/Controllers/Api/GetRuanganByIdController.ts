import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router = Router();

class GetRuanganByIdController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.get("/ruang-kelas/:id", this.getRuanganById.bind(this));
  }

  private async getRuanganById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { id } = req.params;
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

      const existingRuangan = await this.ruang_Kelas.findUnique({
        where: { id_ruang: Number(id) },
        include: { jurusan: true },
      });

      if (!existingRuangan) {
        res.status(404).json({
          status: false,
          message: "Ruangan tidak ditemukan",
          data: null,
        });
        return;
      }

      res.status(200).json({
        status: true,
        message: "Berhasil mengambil data ruang kelas",
        data: existingRuangan,
      });
    } catch (error) {
      console.error("Gagal mengambil data ruangan:", error);
      res.status(500).json({
        status: false,
        message: "Terjadi kesalahan pada server",
        error: (error as Error).message,
      });
    }
  }
}

export default GetRuanganByIdController;
