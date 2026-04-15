import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { ensureAdminExists } from "./lib/auth.js";

const app: Express = express();

// ✅ FIX
const httpLogger = (pinoHttp as any).default
  ? (pinoHttp as any).default
  : pinoHttp;

app.use(
  httpLogger({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

ensureAdminExists().catch((err) => {
  logger.error({ err }, "Failed to ensure admin exists");
});

export default app;