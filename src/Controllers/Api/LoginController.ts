import { NextFunction, Request, Response, Router } from "express";
import { check, ValidationChain, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';

class LoginController extends PrismaClient {
    public router: Router;

    constructor() {
        super();
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post("/login", this.validator(), this.login.bind(this))
    }

    private async login(req: Request<{ email: string; password: string; }>, res: Response, next: NextFunction): Promise<void> {
        const { email, password } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                status: false,
                message: errors.array()[0].msg
            });
            return;
        }

        let existingUser;
        try {
            existingUser = await this.user.findUnique({
                where: {
                    email,
                },
            });
        } catch {
            const error =
                new Error(
                    "Error! Something went wrong."
                );
            return next(error);
        }
        if (!existingUser) {
            res.status(422).json({
                success: false,
                message: 'Username atau Password Salah'
            });
            return;
        }
        let comparePassword = bcrypt.compareSync(password, existingUser?.password);
        if (!comparePassword) {
            res.status(422).json({
                status: false,
                message: 'Username atau Password Salah'
            });
            return;
        }

        let token;
        let refreshToken;
        const privateKey = fs.readFileSync('private.key', 'utf-8');
        const refreshKey = fs.readFileSync('privateRefresh.pem');
        try {
            token = jwt.sign
                (
                    {
                        userId: existingUser?.id,
                        username: existingUser?.name,
                        email: existingUser?.email
                    },
                    privateKey,
                    { expiresIn: "10m", algorithm: 'RS256' },

                );

            refreshToken = jwt.sign({
                userId: existingUser?.id,
                username: existingUser?.name,
                email: existingUser?.email
            }, refreshKey, { expiresIn: '1d', algorithm: 'ES256' }
            );

            await this.refresh_Token.create({
                data: {
                    userId: existingUser.id,
                    token: refreshToken,
                    expiresAt: new Date(Date.now() +  24 * 60 * 60 * 1000)
                }
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === 'production',
                secure: true,
                maxAge: 24 * 60 * 60 * 1000
            }
            );
        } catch (err) {
            res.status(401).json({
                status: false,
                message: 'Unauthorized gagal membuat token'
            });
            return;
        }

        res.status(201).json({
            status: true,
            data: {
                userId: existingUser.id,
                email: existingUser.email,
                role: existingUser.role,
                token: token,
            },
            message: 'Login Succses...'
        });
        await this.$disconnect();
        return;
    }

    private validator(): ValidationChain[] {
        return [
            check('email').notEmpty().withMessage('field password cannot be empty!').isEmail().withMessage('Invalid email address'),
            check('password').notEmpty().withMessage('field password cannot be empty!').isLength({ min: 8, max: 30 }).withMessage('Password must be between 8 and 30 characters')
        ];
    }
}

export default LoginController;