import AuthMiddleWare from "@/middleware/AuthMiddleware";
import { NextFunction, Request, Response, Router } from "express";
import { check, ValidationChain, validationResult } from "express-validator";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { Prisma } from "@prisma/client";

const router: Router = Router();

class ResetPasswordController extends AuthMiddleWare  {
    private users: Prisma.UserUpdateInput;
    constructor() {
        super(router);
        this.users = {
            email: '',
            password: '',
        };
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.protectedRouter.post("/reset-password", this.validator(), this.resetPassword.bind(this));
        this.protectedRouter.post('/request-reset-password', this.requestResetPassword.bind(this));
    }

    private async resetPassword(req: Request<{ password: string, token: string }>, res: Response, next: NextFunction): Promise<void> {
        const { password, token } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                status: false,
                message: errors.array()[0].msg
            });
            return;
        }
        try {
            const passwordToken = jwt.verify(token, fs.readFileSync('./src/Controllers/Api/key-password/public.key','utf-8')) as JwtPayload;
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);
            this.users = {
                email: passwordToken.email,
                password: hash
            }; 
            const data = await this.user.update({
                where: { id: passwordToken.id },
                data: this.users
            });

            res.status(201).json({
                status: true,
                data,
                message: "Succses Resset Password User..."
            });
        } catch (err) {
            res.status(400).json({
                status: false,
                message: "Request data is missing. Token is invalid or expired"
            })
            return next(err);
        }
        return;
    }

    private async requestResetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        const token = req.headers.authorization?.split(" ")[1];
        const publicKey = fs.readFileSync('public.key','utf-8');
        let reqToken;
        try {
            const decodedToken = jwt.verify(token as string, publicKey) as JwtPayload;
            reqToken = jwt.sign
                (
                    {
                        userId: decodedToken.userId,
                        username: decodedToken.username,
                        email: decodedToken.email,
                    },
                    fs.readFileSync('./src/Controllers/Api/key-password/private.key','utf-8'),
                    { expiresIn: "1h", algorithm: 'RS256' }
                );
            res.status(201).json({
                status: true,
                data: {
                    token: reqToken
                },
                message: "Succses Created Password reset token..."
            });
        } catch (err) {
            res.status(400).json({
                status: false,
                message: "Invalid or expired token..."
            });
            return next(err);
        }
        await this.$disconnect();
    }

    private validator(): ValidationChain[] {
        return [
            check('token').notEmpty().withMessage('field token cannot be empty!'),
            check('password')
                .notEmpty().withMessage('field password cannot be empty!')
                .bail()
                .isLength({ min: 8, max: 30 }).withMessage('Password must be between 8 and 30 characters'),
            check('password_confirmation')
                .notEmpty().withMessage('field password_confirmation cannot be empty!')
                .custom((value, { req }) => {
                    if (value !== req.body.password) {
                        throw new Error('Password confirmation does not match with password')
                    }
                    return true;
                })
        ]
    }
}

export default ResetPasswordController;