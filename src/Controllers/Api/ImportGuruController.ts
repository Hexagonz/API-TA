import { Router, Request, Response } from "express";
import multer from "multer";
import XLSX from "xlsx";
import fs from "fs";
import jwt, { JwtPayload } from "jsonwebtoken";
import AuthMiddleware from "@/middleware/AuthMiddleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

class ImportGuruController extends AuthMiddleware {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.post(
      "/guru/import",
      upload.single("file"),
      this.importGuru.bind(this)
    );
  }

  private async importGuru(req: Request, res: Response): Promise<void> {
    const file = req.file;
    const token = req.headers.authorization?.split(" ")[1];

    if (!file || !file.buffer || !file.originalname.endsWith(".xlsx")) {
      res.status(400).json({ message: "File Excel (.xlsx) tidak valid" });
      return;
    }

    try {
      const decoded = jwt.verify(token!, this.privateKey) as JwtPayload;

      if (decoded.role !== "admin" && decoded.role !== "super_admin") {
        res.status(403).json({
          status: false,
          message: "Hanya admin yang dapat mengimpor data guru",
        });
        return;
      }

      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
      }) as unknown[][];

      if (!rawRows.length) {
        res.status(400).json({ message: "File kosong" });
        return;
      }

      const headers = rawRows[0].map((h) => String(h).toLowerCase().trim());

      const nipIdx = headers.findIndex((h) => h.includes("nip"));
      const namaIdx = headers.findIndex((h) => h.includes("nama"));
      const mapelIdx = headers.findIndex((h) => h.includes("mapel"));

      if (nipIdx === -1 || namaIdx === -1 || mapelIdx === -1) {
        res.status(400).json({
          message: "Kolom 'NIP', 'Nama', atau 'Mapel' tidak ditemukan",
        });
        return;
      }

      const dataRows = rawRows.slice(1);
      const inserted: any[] = [];
      const skipped: any[] = [];

      for (const row of dataRows) {
        if (!Array.isArray(row)) continue;

        const nip = String(row[nipIdx] || "").trim();
        const nama_guru = String(row[namaIdx] || "").trim();
        const nama_mapel = String(row[mapelIdx] || "").trim();

        if (!nip || !nama_guru || !nama_mapel) {
          skipped.push({ nip: nip || "-", reason: "Data tidak lengkap" });
          continue;
        }

        const mapel = await this.mata_Pelajaran.findFirst({
          where: {
            OR: [
              {
                nama_mapel: {
                  contains: nama_mapel.toLowerCase(),
                },
              },
              {
                deskripsi: {
                  contains: nama_mapel.toLowerCase(),
                },
              },
            ],
          },
        });

        if (!mapel) {
          skipped.push({
            nip,
            reason: `Mapel "${nama_mapel}" tidak ditemukan`,
          });
          continue;
        }

        const existing = await this.guru.findFirst({ where: { nip } });
        if (existing) {
          skipped.push({ nip, reason: "NIP sudah terdaftar" });
          continue;
        }

        const created = await this.guru.create({
          data: {
            nama_guru,
            nip,
            id_mapel: mapel.id_mapel,
          },
        });

        inserted.push(created);
      }

      res.status(200).json({
        status: true,
        message: `Import selesai: ${inserted.length} guru ditambahkan`,
        inserted: inserted.length,
        skipped,
      });
    } catch (error: any) {
      console.error("[IMPORT ERROR]", error.message);
      res.status(500).json({
        status: false,
        message: "Gagal mengimpor data guru",
        error: error.message,
      });
    }
  }
}

export default ImportGuruController;
