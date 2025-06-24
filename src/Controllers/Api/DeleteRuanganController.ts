import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router = Router();

class DeleteRuanganController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.delete(
      "/ruang-kelas/:id",
      this.deleteRuangan.bind(this)
    );
  }

  private async deleteRuangan(
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
          message: "Akses ditolak: Hanya admin yang bisa menghapus data ruang kelas",
        });
        return;
      }

      const existingRuangan = await this.ruang_Kelas.findUnique({
        where: {
          id_ruang: Number(id),
        },
      });

      if (!existingRuangan) {
        res.status(404).json({
          status: false,
          message: "Ruangan tidak ditemukan",
          data: null,
        });
        return;
      }

      const deletedRuangan = await this.ruang_Kelas.delete({
        where: {
          id_ruang: Number(id),
        },
      });

      res.status(200).json({
        status: true,
        message: "Berhasil menghapus data Ruangan",
        data: deletedRuangan,
      });
    } catch (error) {
      console.error("Error saat menghapus ruangan:", error);
      res.status(500).json({
        status: false,
        message: "Terjadi kesalahan pada server",
        error: (error as Error).message,
      });
    }
  }
}

export default DeleteRuanganController;
