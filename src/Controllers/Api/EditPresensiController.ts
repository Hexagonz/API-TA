// src/controllers/EditPresensiController.ts
import { Request, Response, Router } from "express";
import AuthMiddleWare from "@/middleware/AuthMiddleware";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import { UpdateData, UpdateDataForSiswa } from "@/@types/routerTypes";

const router = Router();

class EditPresensiController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.put("/presensi/:id", this.updatePresensi.bind(this));
  }

  private async updatePresensi(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ status: false, message: "Token tidak ditemukan" });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, this.privateKey) as JwtPayload;
    } catch {
      res.status(401).json({ status: false, message: "Token tidak valid" });
      return;
    }

    const role = decoded.role;
    const username = decoded.username;

    if (!role || !username) {
      res.status(401).json({ status: false, message: "Akses ditolak" });
      return;
    }

    try {
      const presensi = await this.presensi.findUnique({
        where: { id_presensi: Number(id) },
      });

      if (!presensi) {
        res.status(404).json({ status: false, message: "Presensi tidak ditemukan" });
        return;
      }

      let dataUpdate: UpdateData | UpdateDataForSiswa;

      if (role === "siswa") {
        if (req.body.progres !== "pending") {
          res.status(403).json({ status: false, message: "Siswa hanya boleh mengubah progres menjadi 'pending'" });
          return;
        }
        dataUpdate = { progres: "pending", uploaded_at: new Date().toISOString() };
      } else {
        const { waktu, progres, hari, status, keterangan, gambar } = req.body;
        dataUpdate = { waktu, progres, hari, status, keterangan, gambar };
      }

      const updated = await this.presensi.update({
        where: { id_presensi: Number(id) },
        data: dataUpdate,
      });

      res.status(200).json({
        status: true,
        message: "Presensi berhasil diperbarui",
        data: updated,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: false,
        message: "Gagal memperbarui data",
        error: (err as Error).message,
      });
    }
  }
}

export default EditPresensiController;
