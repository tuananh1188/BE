import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRouter } from './routes/auth.route';
import { profileRouter } from './routes/profile.route';
import productRouter from './routes/product.router';
import categoryRouter from './routes/category.router';

export const app = express();
const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true; // same-origin / server-to-server (Vite proxy)
  if (origin === 'https://tuananh-bay.vercel.app') return true;
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true; // any localhost port
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/product', productRouter);
app.use('/api/category', categoryRouter);
app.use(errorMiddleware);
