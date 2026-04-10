import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRouter } from './routes/auth.route';
import { profileRouter } from './routes/profile.route';
import productRouter from './routes/product.router';

export const app = express();
const allowedOrigins = ['https://tuananh-bay.vercel.app', 'http://localhost:5173'];

app.use(cors({ origin: function(origin,callback) {
    if(!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null,true)
    } else{
        callback(new Error('Not allowed by CORS'))
    }},
}));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use(errorMiddleware);
app.use('/api/product',productRouter);
