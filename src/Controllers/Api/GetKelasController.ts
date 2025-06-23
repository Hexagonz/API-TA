import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router = Router();

class GetKelasController extends AuthMiddleWare {

  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");
  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.get("/kelas", this.getKelass.bind(this));
  }

  private async getKelass(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const authHeader = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(
      authHeader as string,
      this.privateKey
    ) as JwtPayload;
    if (decoded.role !== "admin") {
      res.status(403).json({
        status: false,
        message: "Akses ditolak: Hanya admin yang bisa melihat data user",
      });
      return;
    }
    try {
      const existingKelas = await this.kelas.findMany();

      if (!existingKelas || existingKelas.length === 0) {
        res.status(404).json({
          status: false,
          message: "Tidak ada kelas ditemukan",
          data: [],
        });
        return;
      }

      res.status(200).json({
        status: true,
        message: "Berhasil mengambil data Kelas",
        data: existingKelas,
      });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        message: "Terjadi kesalahan pada server",
        error: (error as Error).message,
      });
      return;
    }
  }
}

export default GetKelasController;
