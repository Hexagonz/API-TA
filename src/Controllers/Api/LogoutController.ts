import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from 'fs';

const router = Router();

class LogoutController extends AuthMiddleWare {
    constructor() {
        super(router);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.protectedRouter.post("/logout", this.logout.bind(this));
    }

    private async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        let refreshToken = req.cookies?.refreshToken;
        refreshToken =  this.security.decrypt(refreshToken as string);
        if (!refreshToken) {
            res.status(403).json({ 
                status: false,
                message: 'No refresh token found' 
            });
            return;
        }

        try {
            // Verifikasi refresh token
            const refreshKey = fs.readFileSync("publicRefresh.pem", "utf-8"); // Pastikan file publicRefresh.pem ada dan dapat diakses
            const decodedToken = jwt.verify(refreshToken, refreshKey) as JwtPayload;
    
            // Pastikan token valid dan memiliki userId
            if (!decodedToken?.userId) {
                res.status(403).json({ 
                    status: false,
                    message: 'Invalid refresh token' 
                });
                return;
            }
    
            // Menghapus refresh token spesifik dari database
            const tokenRecord = await this.refresh_Token?.findFirst({
                where: { token: refreshToken },
            });
            
            if (tokenRecord) {
                await this.refresh_Token.delete({
                    where: { id: tokenRecord.id },
                });
            }

            // Bersihkan cookie
            res.clearCookie('refreshToken', { httpOnly: true, secure: true }); // Pastikan cookie dihapus dengan aman
            res.status(200).json({ 
                status: true,
                message: 'Logged out successfully...' 
            });
            return;
        } catch (err) {
            console.error("Logout Error: ", err);
            res.status(403).json({ 
                status: false,
                message: 'Invalid or expired refresh token' 
            });
        return next(err);
        }
    }    
}

export default LogoutController;