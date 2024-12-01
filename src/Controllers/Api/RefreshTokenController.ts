import { NextFunction, Request, Response, Router } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import AuthMiddleWare from "@/middleware/AuthMiddleware";
import fs from 'fs';

const router: Router = Router();

class RefreshTokenController extends AuthMiddleWare {

    constructor() {
        super(router);
        this.initializeRoutes();
    }

    private readonly refreshKey = fs.readFileSync("./lib/publicRefresh.pem", "utf-8");

    private initializeRoutes() {
        this.router.post("/refresh", this.refresh.bind(this));
    }

    private async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
            res.status(403).json({
                status: false,
                message: "Refresh token not found in Authorization header",
            });
            return;
        }
    
        let refreshToken = authorizationHeader.split(" ")[1];
    
        try {
            refreshToken = this.security.decrypt(refreshToken) as string;
            const user = jwt.verify(refreshToken, this.refreshKey) as JwtPayload;
    
            const userId = user.userId;
    
            const accessKey = fs.readFileSync("./lib/private.key", "utf-8");
            const newAccessToken = jwt.sign(
                {
                    userId: user.userId,
                    username: user.username,
                    email: user.email,
                },
                accessKey,
                {
                    expiresIn: "10m",algorithm: 'RS256' 
                }
            );
    
            await this.refresh_Token.deleteMany({
                where: { userId },
            });
            res.json({
                status: true,
                data: {
                    access_token: this.security.encrypt(newAccessToken),
                },
                message: "Successfully created new Access Token",
            });
        } catch (err) {
            console.error("Error processing refresh token:", err);
            res.status(401).json({
                status: false,
                message: "Invalid or expired refresh token",
            });
            return;
        }
        await this.$disconnect();
    }
}
export default RefreshTokenController;
