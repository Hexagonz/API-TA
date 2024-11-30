import { Router, Request, Response, NextFunction } from "express";
import { withMiddleware } from "express-kun";
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { PrismaClient } from '@prisma/client'
import Security from "@/utils/security";

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
                message: "No Authorization Header"
            });
            return;
        }
        const token = authorization.split(" ")[1];
        const decAccses = this.security.decrypt(token as string);
        const publicKey = fs.readFileSync('./lib/public.key', 'utf-8');
        jwt.verify(decAccses as string, publicKey, function (err) {
            if (err?.message === "invalid token") {
                res.status(401).json({
                    status: false,
                    message: "Error! Invalid Token..."
                });
            }
            else if (err?.message === "jwt malformed") {
                res.status(401).json({
                    status: false,
                    message: "Error! Invalid Token Format..."
                });
            } else if (err?.message === "jwt expired") {
                res.status(401).json({
                    status: false,
                    message: "Error! Token Expired..."
                });
            } else if (err?.message === "invalid signature") {
                res.status(401).json({
                    status: false,
                    message: "Error! Invalid Token signature..."
                });
            } else if(err?.message === "invalid algorithm") {
                res.status(401).json({
                    status: false,
                    message: "Error! Invalid Algorithm..."
                });
            } else if(err?.message === "jwt must be provided") {
                res.status(401).json({
                    status: false,
                    message: "Error! Token must be provided..."
                });
            }
            return next(err);
        });
    }
}

export default AuthMiddleWare;
