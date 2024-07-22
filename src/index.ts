import express from "express";
import dotenv from "dotenv";
import { Signale } from "signale";
import morgan from "morgan";
import { } from "../tsconfig.json";
import cors from "cors";
import proxy from "express-http-proxy";
import { Request, Response, NextFunction } from "express";
import axios from "axios";

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
const RENTAL_SERVICE_URL = process.env.RENTAL_SERVICE_URL || "http://localhost:3004";
const SENTIMENT_ANALIZER_URL = process.env.SENTIMENT_ANALIZER_URL || "http://localhost:3005";


const verifyToken = async (token: string): Promise<boolean> => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/api/v1/auth/verify_token`, { accessToken: token });
        return response.data.data.valid === true;
    } catch (error) {
        console.error("Error verifying token:", error);
        return false;
    }
};

const checkAuthAndForward = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('No autorizado');
    }

    const token = authHeader.split(' ')[1];
    const isValidToken = await verifyToken(token);

    if (!isValidToken) {
        return res.status(401).send('Token inválido');
    }

    next();
};

app.get(`${API_PREFIX}/`, (req: Request, res: Response) => {
    res.send("Hello World");
});


app.use(`${API_PREFIX}/auth`, proxy(`${AUTH_SERVICE_URL}/api/v1/auth`, {
    proxyReqPathResolver: (req) => {
        return `/api/v1/auth${req.url}`;
    },
}));

app.use(`${API_PREFIX}/users`, checkAuthAndForward, proxy(`${USER_SERVICE_URL}/api/v1/users`, {
    proxyReqPathResolver: (req) => {
        return `/api/v1/users${req.url}`;
    },
}));

app.use(`${API_PREFIX}/vehicles/images/upload`, checkAuthAndForward, proxy(`${VEHICLE_SERVICE_URL}/api/v1/vehicles/images/upload`,
    {
        proxyReqPathResolver: (req) => {
            return `/api/v1/vehicles/images/upload${req.url}`;
        },
        preserveHostHdr: true,
        parseReqBody: false,
    }
));

app.use(`${API_PREFIX}/vehicles`, checkAuthAndForward, proxy(`${VEHICLE_SERVICE_URL}/api/v1/vehicles`, {
    proxyReqPathResolver: (req) => {
        return `/api/v1/vehicles${req.url}`;
    }
}));

app.use(`${API_PREFIX}/rentals`, checkAuthAndForward, proxy(`${RENTAL_SERVICE_URL}/api/v1/rentals`, {
    proxyReqPathResolver: (req) => {
        return `/api/v1/rentals${req.url}`;
    }
}));

app.use(`${API_PREFIX}/sentiment`, proxy(`${SENTIMENT_ANALIZER_URL}/api/v1/sentiment`, {
    proxyReqPathResolver: (req) => {
        return `/api/v1/sentiment`;
    }
}));

app.use(`${API_PREFIX}/sentiment/time_df`, proxy(`${SENTIMENT_ANALIZER_URL}/api/v1/sentiment/time_df`, {
    proxyReqPathResolver: (req) => {
        return `/api/v1/sentiment/time_df`;
    }
}));

app.listen(PORT, () => {
    signale.success(`Server running on http://localhost:${PORT}${API_PREFIX}`);
});
