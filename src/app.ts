import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRouter } from './routes/auth.route';
import { profileRouter } from './routes/profile.route';
import productRouter from './routes/product.router';
import categoryRouter from './routes/category.router';
import cartRouter from './routes/cart.router';
import orderRouter from './routes/order.router';
import reviewRouter from './routes/review.route';
import favoriteRouter from './routes/favorite.route';
import voucherRouter from './routes/voucher.route';
import { userRouter } from './routes/user.route';
import { getDashboardStats } from './controllers/order.controller';
import { authGuard } from './middlewares/auth.middleware';
import { isAdmin } from './middlewares/admin.middleware';

export const app = express();

// Debug Logging - Top Level
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

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
}));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/product', productRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/vouchers', voucherRouter);
app.use('/api/users', userRouter);
app.use(errorMiddleware);
