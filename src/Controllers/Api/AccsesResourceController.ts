import { Request, Response, Router } from "express";
import AuthMiddleWare from "@/middleware/AuthMiddleware";

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
        res.json('Test Middleware');
    }
}

export default AccsesResourceController;
