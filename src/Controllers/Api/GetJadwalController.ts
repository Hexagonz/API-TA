import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import jwt, { JwtPayload } from "jsonwebtoken";

const getAllRouter = Router();

class GetJadwalController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(getAllRouter);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.get("/jadwal", this.getAllJadwal.bind(this));
  }

  private async getAllJadwal(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(
      authHeader as string,
      this.privateKey
    ) as JwtPayload;

    if (
      decoded.role !== "admin" &&
      decoded.role !== "super_admin" &&
      decoded.role !== "guru"
    ) {
      res
        .status(403)
        .json({ status: false, message: "Only admin can view schedules." });
      return;
    }

    try {
      const data = await this.jadwal.findMany({
        include: {
          kelas: true,
          guru: {
            include: {
              mapel: true,
            },
          },
          ruang: {
            include: {
              jurusan: true,
            },
          },
        },
        orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
      });

      res.status(200).json({
        status: true,
        message: "Berhasil mengambil data Jadwal",
        data,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: "Failed to retrieve schedules.",
        error: (error as Error).message,
      });
    }
  }
}

export default GetJadwalController;
