/**
 * INTERFACES — App Express
 * Configura la aplicación Express con todos sus middlewares y rutas.
 */

import express, { type Application, type Request, type Response } from 'express';
import { nutritionRouter } from './routes/nutrition.routes';
import { planRouter } from './routes/plan.routes';
import { errorHandler } from './middlewares/errorHandler';

export function createApp(): Application {
  const app = express();

  // ── Middlewares globales ──────────────────────────────────────────────────
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Health check ─────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'Atleet Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // ── Rutas ─────────────────────────────────────────────────────────────────
  app.use('/api', nutritionRouter);
  app.use('/api', planRouter);

  // ── 404 handler ──────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' },
    });
  });

  // ── Error handler (SIEMPRE al final) ─────────────────────────────────────
  app.use(errorHandler);

  return app;
}
