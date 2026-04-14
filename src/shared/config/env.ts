/**
 * SHARED — Configuración de Variables de Entorno
 * Valida con Zod que todas las variables críticas estén presentes al arrancar.
 * Falla rápido (fail-fast) si falta algo, evitando errores en runtime.
 */

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  USDA_API_KEY: z.string().default('DEMO_KEY'),
  USDA_BASE_URL: z
    .string()
    .default('https://api.nal.usda.gov/fdc/v1'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
