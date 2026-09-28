import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { ENV } from './config/env';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import reservationRoutes from './routes/reservation.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

// Middlewares
app.use(
  cors({
    origin: [ENV.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CampusMart CMU Marketplace API',
  });
});

// Callback aliases for CPE OAuth allowed whitelist
import { AuthController } from './controllers/auth.controller';
app.get('/callback', AuthController.handleCmuCallback);
app.get('/auth/callback', AuthController.handleCmuCallback);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Centralized error handling
app.use(errorHandler);

export default app;
