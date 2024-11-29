import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from 'fs';

const router = Router();

class LogoutController extends AuthMiddleWare {

    constructor() {
        super(router);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get("/logout", this.logout);
    }

    private async logout(req: Request, res: Response): Promise<void> {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
           res.status(403).json({ 
            status: false,
            message: 'No refresh token found' 
        });
           return;
        }
      
        try {
          // Verifikasi refresh token
          const decodedToken = jwt.verify(refreshToken, fs.readFileSync("publicRefresh.pem","utf-8")) as JwtPayload;
          const userId = decodedToken.userId;
      
          // Menghapus refresh token dari database
          await this.refresh_Token.deleteMany({
            where: { userId },
          });
          res.clearCookie('refreshToken');
          res.status(200).json({ 
            status: true,
            message: 'Logged out successfully...' 
        });
          return;
        } catch (err) {
          res.status(403).json({ 
            status: false,
            message: 'Invalid refresh token' 
        });
          return;
        }
    }
}

export default LogoutController;