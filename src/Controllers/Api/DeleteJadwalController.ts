import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const deleteRouter = Router();

class DeleteJadwalController extends AuthMiddleWare {
  private readonly prisma = new PrismaClient();
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(deleteRouter);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.delete("/jadwal/:id", this.deleteJadwal.bind(this));
  }

  private async deleteJadwal(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const authHeader = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(authHeader as string, this.privateKey) as JwtPayload;

    if (decoded.role !== "admin" && decoded.role !== "super_admin") {
      res.status(403).json({ status: false, message: "Only admin can delete schedule." });
      return;
    }

    try {
      await this.presensi.deleteMany({ where: { id_jadwal: Number(id) } });
      await this.jadwal.delete({ where: { id_jadwal: Number(id) } });

      res.status(200).json({ status: true, message: "Schedule deleted successfully." });
    } catch (error) {
      res.status(500).json({ status: false, message: "Failed to delete schedule.", error: (error as Error).message });
    }
  }
}

export default DeleteJadwalController;