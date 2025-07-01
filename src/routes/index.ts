import express, {
  Application,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import * as fs from "fs";
import path from "path";
import sweggerSpec from "../public/listen";
import swaggerUi from "swagger-ui-express";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";
import http from "http";
// import { scheduleTokenCleanup } from "@/sever";
import cors from "cors";
import WebSocketController from "@/Controllers/Api/WebSocketController";
const app: Application = express();
const port: number | string = process.env.PORT_SERVER || 3001;
const host: string = process.env.HOST || "http://localhost";
const DEFAULT: string = "DefaultUrlController.ts";
const server = http.createServer(app);

// Inisialisasi WebSocket di atas HTTP server
new WebSocketController(server);

const controllersFolder = path.join(__dirname, "../Controllers/Api");
const files = fs.readdirSync(controllersFolder);

// const limiter = rateLimit({
// 	windowMs: 15 * 60 * 1000,
// 	limit: 100,
// 	standardHeaders: true,
// 	legacyHeaders: false,
// });

// scheduleTokenCleanup();
files.filter(async (file) => {
  const filePath = path.join(controllersFolder, file);
  if (file.endsWith("Controller.ts")) {
    import(filePath)
      .then((controllerModule) => {
        const controller = new controllerModule.default();
        app.use(
          cors()
        );
        app.use(express.urlencoded({ extended: true }));
        app.use(cookieParser());
        app.use(express.json());
        app.use(file !== DEFAULT ? "/api/v1/" : "", controller.router);
        // app.use(file !== DEFAULT ? '/api/v1/' : '', controller.router, limiter);
        app.use(
          "/api/public/docs",
          swaggerUi.serve as unknown as RequestHandler,
          swaggerUi.setup(sweggerSpec, {
            explorer: true,
          }) as unknown as RequestHandler
        );
      })
      .catch((err) => {
        console.error(`Error loading controller from ${file}:`, err);
      });
  }
});

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`Request received for: ${req.method} ${host}${req.originalUrl}`);
  next();
});

server.listen(port, () => {
  console.log(`Server running at ${host}:${port}`);
});
