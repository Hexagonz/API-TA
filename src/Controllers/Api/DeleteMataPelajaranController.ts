import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router = Router();

class DeleteMataPelajaranController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.delete("/mata-pelajaran/:id", this.deleteMapel.bind(this));
  }

  private async deleteMapel(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { id } = req.params;
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
              const existingUser = await this.mata_Pelajaran.findUnique({
        where: {
          id_mapel: Number(id),
        },
      });

      if (!existingUser) {
        res.status(404).json({
          status: false,
          message: "Mata Pelajaran tidak ditemukan",
          data: null,
        });
        return;
      }
      const existingMapel = await this.mata_Pelajaran.delete({
        where : {
            id_mapel: Number(id)
        }
      });

      res.status(200).json({
        status: true,
        message: "Berhasil menghapus data Mata Pelajaran",
        data: existingMapel,
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

export default DeleteMataPelajaranController;
