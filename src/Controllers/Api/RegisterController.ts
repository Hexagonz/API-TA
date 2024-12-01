import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import { check, ValidationChain, validationResult } from 'express-validator';
import { PrismaClient, Prisma } from '@prisma/client'

class RegisterController extends PrismaClient {
    public router: Router;
    private users: Prisma.UserCreateInput;

    constructor() {
        super();
        this.router = Router();
        this.users = {
            name: '',
            email: '',
            password: '',
            role: 'admin'
        };
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post("/register", this.validator(), this.register.bind(this));
    }

    private async register(req: Request<{
        username: string;
        email: string;
        password: string;
        role: string
    }>, res: Response): Promise<void> {
        const { username, email, password, role } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(422).json({
                status: false,
                message: errors.array()[0].msg
            });
            return;
        }

        try {
            let existingUser = await this.user.findUnique({
                where: {
                    email,
                  },
            });

            if (!existingUser) {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(password, salt);

                this.users = {
                    name:username, email, password: hash, role
                }
                await this.user.create({data: this.users})


                res.status(201).json({
                    status: true,
                    data: this.users,
                    message: 'User created successfully...',
                })
            } else {
                if (existingUser.email == email || existingUser.name == username) {
                    res.status(409).json({
                        success: false,
                        message: `${existingUser.email === email ? 'Email' : existingUser.name === username ? 'Username' : ''} already exists`,
                    });
                    return;
                }
            }
            return;
        } catch (err) {
            console.log(err)
            res.status(500).json({
                status: false,
                message: 'Internal Server Error',
            })
        }
        await this.$disconnect();
    }

    private validator(): ValidationChain[] {
        return [
            check('email')
                .notEmpty().withMessage('field email cannot be empty!')
                .bail()
                .isEmail().withMessage('Invalid email address'),

            check('username')
                .notEmpty().withMessage('field username cannot be empty!'),

                check('role')
                .notEmpty().withMessage('Field role cannot be empty!')
                .isIn(['admin', 'mahasiswa', 'dosen']).withMessage('Invalid role value!'),

            check('password')
                .notEmpty().withMessage('field password cannot be empty!')
                .bail()
                .isLength({ min: 8, max: 30 }).withMessage('Password must be between 8 and 30 characters'),

            check('password_confirmation')
                .notEmpty().withMessage('field confirmation_password cannot be empty!')
                .custom((value, { req }) => {
                    if (value !== req.body.password) {
                        throw new Error('Password confirmation does not match with password')
                    }
                    return true;
                })
        ];
    }
}

export default RegisterController;
