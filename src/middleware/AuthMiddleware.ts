import { Router, Request, Response, NextFunction } from "express";
import { withMiddleware } from "express-kun";
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { PrismaClient } from '@prisma/client'
import Security from "@/utils/security";
import { error } from "console";

class AuthMiddleWare extends PrismaClient {
    public router: Router;
    public protectedRouter: Router;
    protected security: Security;

    constructor(router: Router) {
        super();
        this.router = router;
        this.security = new Security();
        this.protectedRouter = withMiddleware(this.router, this.authMiddleware.bind(this));
    }

    public authMiddleware(req: Request, res: Response, next: NextFunction): void {
        const authorization = req.headers.authorization;
        
        if (!authorization) {
            res.status(401).json({
                status: false,
                errors: {
                    message: "No Authorization Header"
                }
            });
        }

        const token = authorization?.split(" ")[1];
        const publicKey = fs.readFileSync('./lib/public.key', 'utf-8');

        jwt.verify(token as string, publicKey, (err, decoded) => {
            if (err) {
                const errorMessages: Record<string, string> = {
                    "invalid token": "Error! Invalid Token...",
                    "jwt malformed": "Error! Invalid Token Format...",
                    "jwt expired": "Error! Token Expired...",
                    "invalid signature": "Error! Invalid Token signature...",
                    "invalid algorithm": "Error! Invalid Algorithm...",
                    "jwt must be provided": "Error! Token must be provided..."
                };

                const message = errorMessages[err.message] || "Error! Authentication failed.";
                return res.status(401).json({
                    status: false,
                    errors: { message }
                });
            }

            (req as any).user = decoded;
            next();
        });
    }
}

export default AuthMiddleWare;
