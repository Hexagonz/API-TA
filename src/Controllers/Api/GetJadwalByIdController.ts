import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import jwt, { JwtPayload } from "jsonwebtoken";

const getByIdRouter = Router();

class GetJadwalByIdController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(getByIdRouter);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.get("/jadwal/:id", this.getJadwalById.bind(this));
  }

  private async getJadwalById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const authHeader = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(authHeader as string, this.privateKey) as JwtPayload;

    if (decoded.role !== "admin") {
      res.status(403).json({ status: false, message: "Only admin can view this schedule." });
      return;
    }

    try {
      const data = await this.jadwal.findUnique({
        where: { id_jadwal: Number(id) },
        include: {
          kelas: true,
          mapel: true,
          guru: true,
        },
      });

      if (!data) {
        res.status(404).json({ status: false, message: "Schedule not found." });
        return;
      }

      res.status(200).json({ status: true, data });
    } catch (error) {
      res.status(500).json({ status: false, message: "Failed to retrieve schedule.", error: (error as Error).message });
    }
  }
}

export default GetJadwalByIdController;