import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import AuthMiddleWare from "@/middleware/AuthMiddleware";
import fs from "fs";

const router: Router = Router();

class RefreshTokenController extends AuthMiddleWare {
  constructor() {
    super(router);
    this.initializeRoutes();
  }

  private readonly refreshKey = fs.readFileSync(
    "./lib/publicRefresh.pem",
    "utf-8"
  );

  private readonly accessKey = fs.readFileSync("./lib/private.key", "utf-8");

  private initializeRoutes() {
    this.router.post("/refresh", this.refresh.bind(this));
  }

  private async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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

    let refreshToken = authorizationHeader.split(" ")[1];
    try {
      const user = jwt.verify(refreshToken, this.refreshKey) as JwtPayload;
      const id_user = user.id_user;

      const newAccessToken = jwt.sign(
        {
          userId: user.userId,
          role: user.role,
          username: user.username,
        },
        this.accessKey,
        {
          expiresIn: "15m",
          algorithm: "RS256",
        }
      );

      await this.refresh_Token.deleteMany({
        where: { id_user },
      });
      res.json({
        status: true,
        data: {
          access_token: newAccessToken,
        },
        message: "Successfully created new Access Token",
      });
    } catch (err) {
      console.error("Error processing refresh token:", err);
      res.status(401).json({
        status: false,
        errors: {
          message: "Invalid or expired refresh token",
        },
      });
      return;
    }
  }
}
export default RefreshTokenController;
