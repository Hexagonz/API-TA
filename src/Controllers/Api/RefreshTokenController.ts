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
        if (req.cookies?.refreshToken) {
            const token = req.headers.authorization?.split(" ")[1];

            try {
                const refreshToken = req.cookies.refreshToken;
                const accessKey = fs.readFileSync("public.key", "utf-8");
                const refreshKey = fs.readFileSync("publicRefresh.pem", "utf-8");

                const userCredentials = jwt.verify(token as string, accessKey) as JwtPayload;
                try {
                    const user = jwt.verify(refreshToken, refreshKey) as JwtPayload;
                    const userId = user?.userId;
                    const accessToken = jwt.sign(
                        {
                            userId: userCredentials.userId,
                            username: userCredentials.username,
                            email: userCredentials.email,
                        },
                        refreshKey, {
                        expiresIn: '10m',
                    }
                    );

                    await this.refresh_Token.deleteMany({
                        where: { userId },
                    });
                    res.json({
                        status: true, 
                        data: {
                            accses_token: accessToken,
                        },
                        message: 'Success Created Refresh Token...'
                    });
                    return ;
                } catch (err) {
                    res.status(406).json({ 
                        status:false,
                        message: 'Unauthorized' 
                    });
                    return next(err);
                }
            } catch (err) {
                console.log(err);
                 res.status(406).json({ 
                    status: false,
                    message: 'Unauthorized' 
                });
                 return next(err);
            }
        } else {
            res.status(403).json({ 
                status: false,
                message: 'Refresh token not found' 
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
