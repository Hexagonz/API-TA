import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import { check, ValidationChain, validationResult } from "express-validator";

const router = Router();
class EditSiswaController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.put(
      "/siswa/:id",
      this.validator(),
      this.editSiswa.bind(this)
    );
  }

  private async editSiswa(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { nama_siswa, nisn, no_absen, id_kelas, id_jurusan } = req.body;
    const {id} = req.params;
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
    try {
      const existingSiswa = await this.siswa.findFirst({
        where: {
          nisn: nisn,
        },
      });

      if (existingSiswa && existingSiswa.id_siswa != Number(id)) {
        res.status(404).json({
          status: false,
          message: `Nisn Siswa ${existingSiswa.nisn} already exists`,
          data: null,
        });
        return;
      }
      const update = await this.siswa.update({
        where: {
            id_siswa: Number(id)
        },
        data: {
          nama_siswa,
          nisn,
          no_absen,
          id_kelas,
          id_jurusan,
        },
      });
      res.status(200).json({
        status: true,
        message: "Siswa updated successfully...",
        data: update,
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

  private validator(): ValidationChain[] {
    return [
      check("nama_siswa")
        .notEmpty()
        .withMessage("field nama_siswa cannot be empty!")
        .isLength({ min: 3, max: 60 })
        .withMessage("nama_siswa must be between 3 and 60 characters")
        .matches(/^(?![_-])(?!.*[_-]{2})(?!.*[^a-zA-Z0-9 _-]).*(?<![_-])$/)
        .withMessage("Unique characters are not allowed!"),
      check("nisn")
        .notEmpty()
        .withMessage("field nisn cannot be empty!")
        .isLength({ min: 8, max: 15 })
        .withMessage("nisn must be between 8 and 15 characters")
        .matches(/^(?![_-])(?!.*[_-]{2})(?!.*[^a-zA-Z0-9 _-]).*(?<![_-])$/)
        .withMessage("Unique characters are not allowed!"),
      check("no_absen")
        .notEmpty()
        .withMessage("Field no_absen cannot be empty!")
        .isNumeric()
        .withMessage("Field no_absen must be a number!"),
      check("id_kelas")
        .notEmpty()
        .withMessage("Field id_kelas cannot be empty!")
        .isNumeric()
        .withMessage("Field id_kelas must be a number!"),
      check("id_jurusan")
        .notEmpty()
        .withMessage("Field id_jurusan cannot be empty!")
        .isNumeric()
        .withMessage("Field id_jurusan must be a number!"),
    ];
  }
}

export default EditSiswaController;
