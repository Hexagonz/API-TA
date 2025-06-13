import { Request, Response, Router } from "express";
import AuthMiddleWare from "@/middleware/AuthMiddleware";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";

const router: Router = Router();
class AccsesResourceController extends AuthMiddleWare {
  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.protectedRouter.post("/verify", this.accses.bind(this));
  }

  private readonly accessKey = fs.readFileSync("./lib/public.key", "utf-8");

  private async accses(req: Request, res: Response) {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      res.status(403).json({
        status: false,
        errors: {
          message: "Refresh token not found in Authorization header",
        },
      });
      return;
    }
    let token = authorizationHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, this.accessKey) as JwtPayload;
      return res.status(200).json({
        status: true,
        message: "Token valid",
        data: {
          id: decoded.userId,
          username: decoded.username,
        },
      });
    } catch (err) {
      return res.status(403).json({
        status: false,
        message: "Token tidak valid atau expired",
      });
    }
  }
}

export default AccsesResourceController;
