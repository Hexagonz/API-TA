import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router = Router();

class GetMataPelajaranByIdController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.get("/mata-pelajaran/:id", this.getMapelId.bind(this));
  }

  private async getMapelId(
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
    if (decoded.role !== "admin" && decoded.role !== "super_admin") {
      res.status(403).json({
        status: false,
        message: "Akses ditolak: Hanya admin yang bisa melihat data user",
      });
      return;
    }
    try {
      const existingUser = await this.mata_Pelajaran.findUnique({
        where : {
            id_mapel: Number(id)
        }
      });

      if (!existingUser) {
        res.status(404).json({
          status: false,
          message: "Mata Pelajaran tidak ditemukan",
          data: null,
        });
        return;
      }

      res.status(200).json({
        status: true,
        message: "Berhasil mengambil data Mata Pelajaran",
        data: existingUser,
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

export default GetMataPelajaranByIdController;
