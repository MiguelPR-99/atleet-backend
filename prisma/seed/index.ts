/**
 * ATLEET — Seed Orchestrator
 * Punto de entrada del seeding múltiple cuando hay varios módulos.
 * Actualmente delega al smae.seed.ts que es autoejectable.
 *
 * Uso: npm run db:seed (ejecuta smae.seed.ts directamente vía package.json)
 *
 * Cuando agregues más seeds (USDA, usuarios demo, etc.) añádelos aquí.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║  ATLEET — Database Seed Orchestrator   ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  // ── Fase 1: Catálogo SMAE ────────────────────────────────────────────────
  console.log('📦 Fase 1: SmaeCategory (22 grupos SMAE 4ta Edición)');
  console.log('   → Ejecuta: npx tsx prisma/seed/smae.seed.ts');
  console.log('');

  // ── Futuras fases (descomenta cuando los seeds estén listos) ─────────────
  // console.log('📦 Fase 2: USDA Ingredients');
  // const { seedUsda } = await import('./usda.seed');
  // await seedUsda(prisma);

  console.log('✅ Seed orchestration completado');
  console.log('');
  console.log('💡 Para ejecutar todos los seeds individualmente:');
  console.log('   npm run db:seed');
}

main()
  .catch((error) => {
    console.error('❌ Error en seed orchestrator:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
