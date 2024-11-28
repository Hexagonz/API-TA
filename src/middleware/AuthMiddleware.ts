import { Router, Request, Response, NextFunction } from "express";
import { withMiddleware } from "express-kun";
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { PrismaClient } from '@prisma/client'

class AuthMiddleWare extends PrismaClient {
    public router: Router;
    public protectedRouter: Router;

    constructor(router: Router) {
        super();
        this.router = router;
        this.protectedRouter = withMiddleware(this.router, this.authMiddleware.bind(this));
    }

    public authMiddleware(req: Request, res: Response, next: NextFunction): void {
        const authorization = req.headers.authorization;
        if (!authorization) {
            res.status(401).json({ message: "No Authorization Header" });
            return;
        }
        const token = authorization.split(" ")[1];
        const publicKey = fs.readFileSync('public.key', 'utf-8');
        jwt.verify(token, publicKey, function (err, decoded) {
            if (err?.message === "invalid token") {
                res.status(401).json({
                    success: false,
                    message: "Error! Invalid Token..."
                });
            }
            else if (err?.message === "jwt malformed") {
                res.status(401).json({
                    success: false,
                    message: "Error! Invalid Token Format..."
                });
            } else if(err?.message === "jwt expired") {
                res.status(401).json({
                    success: false,
                    message: "Error! Token Expired..."
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: "Error! Invalid Token signature..."
                });
            }
            next(err);
            return;   
        });
    }
}

export default AuthMiddleWare;
