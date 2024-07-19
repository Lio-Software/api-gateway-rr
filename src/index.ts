import express from "express";
import dotenv from "dotenv";
import { Signale } from "signale";
import morgan from "morgan";
import { } from "../tsconfig.json";
import cors from "cors";
import proxy from "express-http-proxy";

const app = express();
const signale = new Signale();

dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || "/api/v1";

app.options("*", cors())
app.use(cors());

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3002";
const VEHICLE_SERVICE_URL = process.env.VEHICLE_SERVICE_URL || "http://localhost:3003";

app.use(`${API_PREFIX}/auth`, proxy(`${AUTH_SERVICE_URL}/api/v1/auth`, {
    proxyReqPathResolver: (req) => {
        return `/api/v1/auth${req.url}`;
    },
}));

app.use(`${API_PREFIX}/users`, proxy(`${USER_SERVICE_URL}/api/v1/users`, {
    proxyReqPathResolver: (req) => {
        return `/api/v1/users${req.url}`;
    },
}));

app.use(`${API_PREFIX}/vehicles/images/upload`, proxy(`${VEHICLE_SERVICE_URL}/api/v1/vehicles/images/upload`,
    {
        proxyReqPathResolver: (req) => {
            return `/api/v1/vehicles/images/upload${req.url}`;
        },
        preserveHostHdr: true,
        parseReqBody: false,
    }
));

app.use(`${API_PREFIX}/vehicles`, proxy(`${VEHICLE_SERVICE_URL}/api/v1/vehicles`, {
    proxyReqPathResolver: (req) => {
        return `/api/v1/vehicles${req.url}`;
    }
}));


app.listen(PORT, () => {
    signale.success(`Server running on http://localhost:${PORT}${API_PREFIX}`);
});
