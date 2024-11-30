import express, { Application, NextFunction, Request, RequestHandler, Response } from 'express';
import * as fs from 'fs';
import path from 'path';
import sweggerSpec from '../public/listen';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import { scheduleTokenCleanup } from './sever';
const app: Application = express();
const port: number | string = process.env.PORT_SERVER || 3000;
const host: string = process.env.HOST || 'http://localhost';
const DEFAULT: string = 'DefaultUrlController.ts';

const controllersFolder = path.join(__dirname, '../Controllers/Api');
const files = fs.readdirSync(controllersFolder);

scheduleTokenCleanup();
files.filter(async(file) => {
    const filePath = path.join(controllersFolder, file);
    if (file.endsWith('Controller.ts')) {
        import(filePath).then((controllerModule) => {
            const controller = new controllerModule.default();
            app.use(express.urlencoded({ extended: true }));
            app.use(cookieParser());
            app.use(express.json());
            app.use(file !== DEFAULT ? '/api/v1/' : '', controller.router);
            app.use(
                "/api/public/docs",
                swaggerUi.serve as unknown as RequestHandler,
                swaggerUi.setup(sweggerSpec, { explorer: true }) as unknown as RequestHandler
            );
        }).catch((err) => {
            console.error(`Error loading controller from ${file}:`, err);
        });
    }
});


app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`Request received for: ${req.method} ${host}${req.originalUrl}`);
    next();
});

app.listen(port, () => {
    console.log(`Server running at http://${host}:${port}`);
});

