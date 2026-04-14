/**
 * ATLEET — Seed Script
 * Pobla la tabla SmaeCategory con los 22 grupos oficiales del
 * Sistema Mexicano de Alimentos Equivalentes (SMAE) — 4ta Edición.
 *
 * Fuente: Pérez Lizaur AB, Palacios González B, Castro Becerra AL.
 *         Sistema Mexicano de Alimentos Equivalentes. 4ª ed. México: Ogali; 2014.
 *
 * IMPORTANTE: Los valores promedio (avgCarbs, avgProteins, avgFats, avgKcal)
 * son los valores TEÓRICOS del manual SMAE. Para cálculo preciso, el motor
 * siempre usa los valores USDA FDC del perfil del ingrediente específico.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Definición de los 22 Grupos SMAE (4ta Edición) ──────────────────────────
// Formato: { name, shortCode, avgCarbs, avgProteins, avgFats, avgKcal }
// Unidades: gramos (CHO/P/G) y kilocalorías (Kcal) por 1 equivalente

const smaeCategories = [
  // ── Grupo 1: Verduras ────────────────────────────────────────────────────
  {
    name: 'Verduras',
    shortCode: 'VER',
    avgCarbs: 4,
    avgProteins: 2,
    avgFats: 0,
    avgKcal: 25,
  },

  // ── Grupo 2: Frutas ──────────────────────────────────────────────────────
  {
    name: 'Frutas',
    shortCode: 'FRU',
    avgCarbs: 15,
    avgProteins: 0,
    avgFats: 0,
    avgKcal: 60,
  },

  // ── Grupo 3: Cereales y Tubérculos (sin grasa) ───────────────────────────
  {
    name: 'Cereales y tubérculos sin grasa',
    shortCode: 'CER-SG',
    avgCarbs: 15,
    avgProteins: 2,
    avgFats: 0,
    avgKcal: 70,
  },

  // ── Grupo 4: Cereales y Tubérculos (con grasa) ───────────────────────────
  {
    name: 'Cereales y tubérculos con grasa',
    shortCode: 'CER-CG',
    avgCarbs: 15,
    avgProteins: 2,
    avgFats: 5,
    avgKcal: 115,
  },

  // ── Grupo 5: Leguminosas ─────────────────────────────────────────────────
  {
    name: 'Leguminosas',
    shortCode: 'LEG',
    avgCarbs: 20,
    avgProteins: 7,
    avgFats: 1,
    avgKcal: 120,
  },

  // ── Grupo 6–9: Alimentos de Origen Animal (AOA) ──────────────────────────
  {
    name: 'Alimentos de origen animal (Muy bajo aporte de grasa)',
    shortCode: 'AOA-MB',
    avgCarbs: 0,
    avgProteins: 7,
    avgFats: 1,
    avgKcal: 40,
  },
  {
    name: 'Alimentos de origen animal (Bajo aporte de grasa)',
    shortCode: 'AOA-B',
    avgCarbs: 0,
    avgProteins: 7,
    avgFats: 3,
    avgKcal: 55,
  },
  {
    name: 'Alimentos de origen animal (Moderado aporte de grasa)',
    shortCode: 'AOA-MOD',
    avgCarbs: 0,
    avgProteins: 7,
    avgFats: 5,
    avgKcal: 75,
  },
  {
    name: 'Alimentos de origen animal (Alto aporte de grasa)',
    shortCode: 'AOA-A',
    avgCarbs: 0,
    avgProteins: 7,
    avgFats: 8,
    avgKcal: 100,
  },

  // ── Grupo 10–13: Leche ───────────────────────────────────────────────────
  {
    name: 'Leche descremada',
    shortCode: 'LECHE-D',
    avgCarbs: 12,
    avgProteins: 8,
    avgFats: 0,
    avgKcal: 95,
  },
  {
    name: 'Leche semidescremada',
    shortCode: 'LECHE-SD',
    avgCarbs: 12,
    avgProteins: 8,
    avgFats: 4,
    avgKcal: 120,
  },
  {
    name: 'Leche entera',
    shortCode: 'LECHE-E',
    avgCarbs: 12,
    avgProteins: 8,
    avgFats: 8,
    avgKcal: 150,
  },
  {
    name: 'Leche con grasa adicional',
    shortCode: 'LECHE-GA',
    avgCarbs: 12,
    avgProteins: 8,
    avgFats: 12,
    avgKcal: 185,
  },

  // ── Grupo 14–15: Aceites y Grasas ────────────────────────────────────────
  {
    name: 'Aceites y grasas sin proteína',
    shortCode: 'GRASA-SP',
    avgCarbs: 0,
    avgProteins: 0,
    avgFats: 5,
    avgKcal: 45,
  },
  {
    name: 'Aceites y grasas con proteína',
    shortCode: 'GRASA-CP',
    avgCarbs: 0,
    avgProteins: 2,
    avgFats: 5,
    avgKcal: 55,
  },

  // ── Grupo 16–17: Azúcares ────────────────────────────────────────────────
  {
    name: 'Azúcares sin grasa',
    shortCode: 'AZU-SG',
    avgCarbs: 10,
    avgProteins: 0,
    avgFats: 0,
    avgKcal: 40,
  },
  {
    name: 'Azúcares con grasa',
    shortCode: 'AZU-CG',
    avgCarbs: 10,
    avgProteins: 0,
    avgFats: 5,
    avgKcal: 85,
  },

  // ── Grupo 18: Bebidas Alcohólicas ────────────────────────────────────────
  {
    name: 'Bebidas alcohólicas',
    shortCode: 'ALC',
    avgCarbs: 5,
    avgProteins: 0,
    avgFats: 0,
    avgKcal: 90,
  },

  // ── Grupo 19: Alimentos Libres de Energía ────────────────────────────────
  {
    name: 'Alimentos libres de energía',
    shortCode: 'LIBRE',
    avgCarbs: 0,
    avgProteins: 0,
    avgFats: 0,
    avgKcal: 0,
  },

  // ── Grupo 20–22: Alimentos Preparados / Industrializados ─────────────────
  {
    name: 'Botanas, cereales, dulces y postres',
    shortCode: 'BOT',
    avgCarbs: 15,
    avgProteins: 2,
    avgFats: 5,
    avgKcal: 115,
  },
  {
    name: 'Sopas, caldos, cremas, guisos y otros',
    shortCode: 'SOPA',
    avgCarbs: 10,
    avgProteins: 5,
    avgFats: 3,
    avgKcal: 85,
  },
  {
    name: 'Comidas rápidas y antojitos mexicanos',
    shortCode: 'FAST',
    avgCarbs: 20,
    avgProteins: 5,
    avgFats: 8,
    avgKcal: 170,
  },
] as const;

// ── Ejecución del Seed ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed de SmaeCategory...');
  console.log(`   Grupos a insertar: ${smaeCategories.length}`);

  let created = 0;
  let skipped = 0;

  for (const category of smaeCategories) {
    const existing = await prisma.smaeCategory.findUnique({
      where: { shortCode: category.shortCode },
    });

    if (existing) {
      console.log(`   ⏭  Ya existe: [${category.shortCode}] ${category.name}`);
      skipped++;
      continue;
    }

    await prisma.smaeCategory.create({ data: category });
    console.log(`   ✅ Creado: [${category.shortCode}] ${category.name}`);
    created++;
  }

  console.log('\n─────────────────────────────────');
  console.log(`✅ Seed completado:`);
  console.log(`   • Creados : ${created}`);
  console.log(`   • Omitidos: ${skipped} (ya existían)`);
  console.log(`   • Total   : ${smaeCategories.length} grupos SMAE`);
}

main()
  .catch((error) => {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
