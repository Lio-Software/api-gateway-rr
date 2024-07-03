import express, { Application } from "express";
import morgan from "morgan";

import dotenv from "dotenv";
import { Signale } from "signale";
import proxy from "express-http-proxy";

const app: Application = express();
const signale = new Signale();

dotenv.config();

app.use(morgan("dev"));
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || "/api/v1";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";

app.use(`${API_PREFIX}/auth`, proxy(`${AUTH_SERVICE_URL}/api/v1/auth`, {
    proxyReqPathResolver: (req) => {
        return `/api/v1/auth${req.url}`;
    }
}));

app.listen(PORT, () => {
    signale.success(`Server running on http://localhost:${PORT}${API_PREFIX}`);
});
