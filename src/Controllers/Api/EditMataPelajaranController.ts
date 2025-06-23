import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import { check, ValidationChain, validationResult } from "express-validator";

const router = Router();
class EditMataPelajaranController extends AuthMiddleWare {
  private readonly privateKey = fs.readFileSync("./lib/public.key", "utf-8");

  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.protectedRouter.put(
      "/mata-pelajaran/:id",
      this.validator(),
      this.editMataPelajaran.bind(this)
    );
  }

  private async editMataPelajaran(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { nama_mapel, deskripsi } = req.body;
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
      const existingMapel = await this.mata_Pelajaran.findFirst({
        where: {
          nama_mapel: nama_mapel,
          deskripsi: deskripsi
        },
      });

      if (existingMapel && existingMapel.id_mapel != Number(id)) {
        res.status(404).json({
          status: false,
          message: `Mata Pelajaran ${existingMapel.nama_mapel} already exists`,
          data: null,
        });
        return;
      }
      const update = await this.mata_Pelajaran.update({
        where: {
          id_mapel: Number(id),
        },
        data: {
          nama_mapel: nama_mapel,
          deskripsi: deskripsi
        },
      });
      res.status(200).json({
        status: true,
        message: "Mata Pelajaran updated successfully...",
        data: update,
      });
      return;
    } catch (error) {
      console.error(error);
      res.status(404).json({
        status: false,
        message: "Id Mata Pelajaran tidak ditemukan",
        data: null,
      });
      return;
    }
  }

  private validator(): ValidationChain[] {
    return [
      check("nama_mapel")
        .notEmpty()
        .withMessage("field nama_mapel cannot be empty!")
        .isLength({ min: 2, max: 10 })
        .withMessage("Mata Pelajaran must be between 2 and 10 characters")
        .matches(/^(?![_-])(?!.*[_-]{2})(?!.*[^a-zA-Z0-9 _-]).*(?<![_-])$/)
        .withMessage("Unique characters are not allowed!"),
      check("deskripsi")
        .notEmpty()
        .withMessage("field deskripsi cannot be empty!")
        .isLength({ min: 4, max: 50 })
        .withMessage("Deskripsi must be between 4 and 50 characters")
        .matches(/^(?![_-])(?!.*[_-]{2})(?!.*[^a-zA-Z0-9 _-]).*(?<![_-])$/)
        .withMessage("Unique characters are not allowed!"),
    ];
  }
}

export default EditMataPelajaranController;
