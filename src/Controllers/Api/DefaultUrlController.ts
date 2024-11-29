import { Request, Response, Router } from "express";

class DefaultUrlController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get("/", this.defaultRouter);
    }

    private defaultRouter(req: Request, res: Response): void {
        res.status(200).send("Request: /api/v1/ <br/> Documentation: /api/public/docs");
    }
}

export default DefaultUrlController;