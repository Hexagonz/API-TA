import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router = Router();

class GetFilteredSiswaController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.get("/siswa/filter", this.getFilteredSiswas.bind(this));
  }

  private async getFilteredSiswas(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization?.split(" ")[1];
      const decoded = jwt.verify(
        authHeader as string,
        this.privateKey
      ) as JwtPayload;

      if (decoded.role !== "admin" && decoded.role !== "super_admin" && decoded.role !== "guru") {
        res.status(403).json({
          status: false,
          message: "Akses ditolak: Hanya admin yang bisa melihat data user",
        });
        return;
      }

      const { id_jurusan, id_kelas, id_ruang } = req.query;

      const filters: any = {};

      if (id_jurusan) {
        filters.id_jurusan = parseInt(id_jurusan as string);
      }

      if (id_kelas) {
        filters.id_kelas = parseInt(id_kelas as string);
      }

      if (id_ruang) {
        filters.id_ruang = parseInt(id_ruang as string);
      }

      const siswaFiltered = await this.siswa.findMany({
        where: filters,
        include: {
          jurusan: true,
          kelas: true,
          ruang: true,
        },
        orderBy: {
            no_absen: 'asc'
        }
      });

      if (!siswaFiltered || siswaFiltered.length === 0) {
        res.status(404).json({
          status: false,
          message: "Data siswa tidak ditemukan sesuai filter",
          data: [],
        });
        return;
      }

      res.status(200).json({
        status: true,
        message: "Berhasil mengambil data siswa terfilter",
        data: siswaFiltered,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({
        status: false,
        message: "Terjadi kesalahan pada server",
        error: (error as Error).message,
      });
    }
  }
}

export default GetFilteredSiswaController;
