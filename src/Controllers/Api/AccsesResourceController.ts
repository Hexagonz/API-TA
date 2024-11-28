import { Request, Response, Router } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import AuthMiddleWare from "@/middleware/AuthMiddleware";
import fs from 'fs';

const router: Router = Router(); 
class AccsesResourceController extends AuthMiddleWare {

    constructor() {
        super(router);
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.protectedRouter.post("/auth", this.accses);
    }

    private async accses(req: Request, res: Response) {
        res.json('asamsas');
    }
}

export default AccsesResourceController;
