/**
 * INFRAESTRUCTURA — Singleton de PrismaClient
 * Implementación resiliente con Pool de PostgreSQL estabilizado.
 *
 * PROBLEMA RESUELTO: ECONNREFUSED en desarrollo con tsx watch
 * CAUSA: El Pool de pg se creaba sin timeout ni manejo de errores.
 *        Cuando tsx watch recargaba el módulo, el Pool quedaba en estado
 *        zombie: las conexiones estaban cerradas pero el adapter no lo sabía.
 *
 * SOLUCIÓN: Pool configurado con:
 *   - connectionTimeoutMillis: aborta si no obtiene conexión en 5s
 *   - idleTimeoutMillis: libera conexiones inactivas tras 10s
 *   - max: límite explícito de conexiones concurrentes
 *   - on('error'): maneja desconexiones inesperadas sin crash
 *
 * COMPATIBLE CON PRISMA 7 (Driver Adapter obligatorio).
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ── Pool de PostgreSQL con configuración de resiliencia ───────────────────────
function createPool(): Pool {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Número máximo de clientes en el pool
    max: 10,
    // Si no hay conexión disponible en 5s → error inmediato (no colgar)
    connectionTimeoutMillis: 5000,
    // Las conexiones idle se liberan tras 10 segundos
    idleTimeoutMillis: 10000,
    // Keepalive para evitar que conexiones de larga duración expiren
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  // ── Manejo de errores del Pool (crítico para tsx watch) ───────────────────
  // Sin este handler, un error de conexión crashea el proceso completo.
  pool.on('error', (err) => {
    console.error('❌ Error fatal inesperado en el Pool de Prisma (PostgreSQL):', err);
  });

  return pool;
}

// Instanciamos el Pool y el Adapter
const pool = createPool();
const adapter = new PrismaPg(pool);

// ── Singleton de Prisma para evitar agotar conexiones ───────────────────────────
// Tipado correcto para usar scope global en Node sin conflictos de Typescript.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Forzamos el uso del Driver Adapter para el Pool de `pg`
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

// En desarrollo, mantenemos la instancia cacheada en el ambiente global
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Función de utilidad para Graceful Shutdown del servidor.
 * Desconecta tanto Prisma como el Pool nativo de PostgreSQL.
 */
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    // A diferencia de un client normal, con adapter-pg DEBEMOS detener el pool
    await pool.end();
    console.log('✅ Prisma y Pool de PostgreSQL desconectados exitosamente.');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('❌ Error al desconectar Prisma/Pool:', errorMsg);
  }
}
