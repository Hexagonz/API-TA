import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import AuthMiddleWare from "@/middleware/AuthMiddleware";
import cron from 'node-cron';
import fs from 'fs';

const router: Router = Router();

class RefreshTokenController extends AuthMiddleWare {

    constructor() {
        super(router);
        this.initializeRoutes();
        this.scheduleTokenCleanup();
    }

    private initializeRoutes() {
        this.protectedRouter.post("/refresh", this.refresh);
    }

    private async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            res.status(403).json({ 
                status: false, 
                message: 'Refresh token not found' 
            });
            return;
        }
    
        const accessToken = req.headers.authorization?.split(" ")[1];
        if (!accessToken) {
            res.status(401).json({ 
                status: false, 
                message: 'Access token is missing' 
            });
            return;
        }
    
        try {
            const accessKey = fs.readFileSync("public.key", "utf-8");
            const refreshKey = fs.readFileSync("publicRefresh.pem", "utf-8");
    
            // Verifikasi access token
            const userCredentials = jwt.verify(accessToken, accessKey) as JwtPayload;
            
            // Verifikasi refresh token
            try {
                const user = jwt.verify(refreshToken, refreshKey) as JwtPayload;
                const userId = user.userId;
    
                // Generate a new access token
                const newAccessToken = jwt.sign(
                    {
                        userId: userCredentials.userId,
                        username: userCredentials.username,
                        email: userCredentials.email,
                    },
                    refreshKey, {
                        expiresIn: '10m',
                    }
                );
    
                // Hapus refresh token yang sudah kadaluarsa atau tidak valid
                await this.refresh_Token.deleteMany({
                    where: { userId },
                });
    
                // Kirimkan response dengan access token baru
                res.json({
                    status: true, 
                    data: {
                        access_token: newAccessToken,
                    },
                    message: 'Successfully created new Access Token',
                });
            } catch (err) {
                console.error('Invalid refresh token:', err);
                res.status(401).json({ 
                    status: false, 
                    message: 'Invalid or expired refresh token' 
                });
                return;
            }
        } catch (err) {
            console.error('Error verifying access token:', err);
            res.status(401).json({ 
                status: false, 
                message: 'Unauthorized access' 
            });
            return;
        }
    }
    

    private scheduleTokenCleanup(): void {
        cron.schedule('0 0 * * *', async () => { 
            try {
                console.log("Starting token cleanup...");
                await this.refresh_Token.deleteMany({
                    where: {
                        expiresAt: { lt: new Date() } 
                    }
                });

                console.log("Token cleanup completed.");
            } catch (err) {
                console.error("Error during token cleanup:", err);
            }
        });
    }
}
export default RefreshTokenController;
