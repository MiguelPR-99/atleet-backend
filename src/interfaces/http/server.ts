/**
 * INTERFACES — Server Bootstrap
 * Punto de entrada de la aplicación. Carga el env, crea la app y escucha.
 */

import 'dotenv/config'; // DEBE ser el primer import — carga .env antes de la validación
import './../../shared/config/env'; // Valida env al arrancar (fail-fast)
import { env } from '../../shared/config/env';
import { createApp } from './app';
import { prisma, disconnectPrisma } from '../../infrastructure/database/prisma.client';

async function bootstrap(): Promise<void> {
  // Verificar conexión a base de datos
  try {
    await prisma.$connect();
    console.log('✅ Conectado a PostgreSQL');
  } catch (error) {
    console.error('❌ No se pudo conectar a PostgreSQL:', error);
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   🏋️  ATLEET Backend API — Running       ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log(`   📡 URL   : http://localhost:${env.PORT}`);
    console.log(`   🩺 Health: http://localhost:${env.PORT}/health`);
    console.log(`   🌍 Env   : ${env.NODE_ENV}`);
    console.log('');
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n⚡ ${signal} recibido. Cerrando servidor...`);
    server.close(async () => {
      await disconnectPrisma(); // Cierra Prisma + Pool PG ordenadamente
      console.log('✅ Servidor cerrado correctamente.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void bootstrap();
