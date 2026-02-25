import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { geoDetectionMiddleware } from "./middleware/geoDetection";
import { pool } from "./db";
import { DEFAULT_SESSION_MAX_AGE, SESSION_COOKIE_NAME } from "./session";
import { buildApiLogLine, shouldSkipBodyParsers } from "./http/requestRouting";

const PgStore = connectPgSimple(session);

const app = express();
app.set("trust proxy", 1);

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be defined");
}

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new PgStore({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    name: SESSION_COOKIE_NAME,
    cookie: {
      secure: app.get("env") === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: DEFAULT_SESSION_MAX_AGE,
    },
    unset: "destroy",
  }),
);

const jsonParser = express.json();
const urlEncodedParser = express.urlencoded({ extended: false });

app.use((req, res, next) => {
  if (shouldSkipBodyParsers(req.originalUrl)) {
    next();
    return;
  }
  jsonParser(req, res, next);
});

app.use((req, res, next) => {
  if (shouldSkipBodyParsers(req.originalUrl)) {
    next();
    return;
  }
  urlEncodedParser(req, res, next);
});

app.use(geoDetectionMiddleware);

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  res.setHeader("X-Robots-Tag", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  next();
});

// Cache static assets for 1 year in production
app.use((req, res, next) => {
  if (req.path.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(
        buildApiLogLine({
          method: req.method,
          path,
          statusCode: res.statusCode,
          durationMs: duration,
        }),
      );
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`error ${status}: ${message}`);
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
