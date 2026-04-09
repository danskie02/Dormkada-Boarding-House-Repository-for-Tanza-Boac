import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug endpoint to check environment
app.get("/debug/env", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL ? "✓ Set" : "✗ Not set",
    DATABASE_URL_PREVIEW: process.env.DATABASE_URL?.substring(0, 50) + "...",
  });
});

app.use("/api", router);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express error handler caught:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err?.message || String(err),
    stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
  });
});

export default app;
