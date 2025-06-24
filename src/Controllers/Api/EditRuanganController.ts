import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import { check, ValidationChain, validationResult } from "express-validator";

const router = Router();

class EditRuanganController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.put(
      "/ruang-kelas/:id",
      this.validator(),
      this.editRuangan.bind(this)
    );
  }

  private async editRuangan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { nomor_ruang, id_jurusan } = req.body;
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
          message: "Akses ditolak: Hanya admin yang bisa mengedit data ruang kelas",
        });
        return;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors: Array<{ param: string; msg: string }> = errors
          .array()
          .map((error) => ({
            param: (error as any).path,
            msg: (error as any).msg,
          }));

        res.status(400).json({
          status: false,
          errors: validationErrors.map((err) => ({
            field: err.param,
            message: err.msg,
          })),
        });
        return;
      }

      // Cek jika nomor_ruang + id_jurusan sudah digunakan ruangan lain
      const existingRuangan = await this.ruang_Kelas.findFirst({
        where: {
          nomor_ruang: Number(nomor_ruang),
          id_jurusan: Number(id_jurusan),
        },
      });

      if (existingRuangan && existingRuangan.id_ruang !== Number(id)) {
        res.status(409).json({
          status: false,
          message: `Ruangan dengan nomor ${nomor_ruang} dan jurusan tersebut sudah ada`,
          data: null,
        });
        return;
      }

      const update = await this.ruang_Kelas.update({
        where: {
          id_ruang: Number(id),
        },
        data: {
          nomor_ruang: Number(nomor_ruang),
          id_jurusan: Number(id_jurusan),
        },
      });

      const data = {
        id: update.id_ruang,
        nomor_ruang: update.nomor_ruang,
        id_jurusan: update.id_jurusan,
      };

      res.status(200).json({
        status: true,
        message: "Ruangan berhasil diperbarui",
        data,
      });
    } catch (error) {
      console.error(error);
      res.status(404).json({
        status: false,
        message: "Id Ruangan tidak ditemukan",
        data: null,
      });
    }
  }

  private validator(): ValidationChain[] {
    return [
      check("nomor_ruang")
        .notEmpty()
        .withMessage("field nomor_ruang tidak boleh kosong!")
        .isInt({ min: 1, max: 255 })
        .withMessage("nomor_ruang harus berupa angka antara 1 sampai 255"),
      check("id_jurusan")
        .notEmpty()
        .withMessage("field id_jurusan tidak boleh kosong!")
        .isNumeric()
        .withMessage("id_jurusan harus berupa angka!"),
    ];
  }
}

export default EditRuanganController;
