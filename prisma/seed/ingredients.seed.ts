/**
 * ATLEET — Seed de Ingredientes Base (Starter Kit)
 * Pobla la tabla `Ingredient` con 20 alimentos básicos de la dieta mexicana.
 *
 * Fuente nutricional: USDA FoodData Central (datos por 100g).
 * Mapeo SMAE: Referencia 4ta edición del SMAE (Pérez Lizaur, 2014).
 *
 * Ejecutar con: npm run db:seed:ingredients
 *
 * PREREQUISITO: El seed de SmaeCategory debe haberse ejecutado primero.
 *   npm run db:seed  (ejecuta smae.seed.ts)
 */

import 'dotenv/config';
import { PrismaClient, DataSource } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Tipos internos del script ─────────────────────────────────────────────────

interface NutrientDef {
  fdcNutrientId: number;
  name: string;
  unitName: string;
  isMacronutrient: boolean;
  amountPer100g: number;
}

interface PortionDef {
  description: string;
  gramWeight: number;
}

interface IngredientDef {
  fdcId: number;
  name: string;
  smaeShortCode: string;
  equivalentWeight: number; // gramos de este ingrediente = 1 equivalente SMAE
  equivalentMeasure: string;
  nutrients: NutrientDef[];
  portions: PortionDef[];
}

// ── Nutrientes estándar del catálogo USDA (se crearán con upsert) ─────────────
const NUTRIENT_CATALOG: Omit<NutrientDef, 'amountPer100g'>[] = [
  { fdcNutrientId: 1008, name: 'Energy',                   unitName: 'kcal', isMacronutrient: true  },
  { fdcNutrientId: 1003, name: 'Protein',                   unitName: 'g',    isMacronutrient: true  },
  { fdcNutrientId: 1004, name: 'Total lipid (fat)',          unitName: 'g',    isMacronutrient: true  },
  { fdcNutrientId: 1005, name: 'Carbohydrate, by difference',unitName: 'g',    isMacronutrient: true  },
  { fdcNutrientId: 1079, name: 'Fiber, total dietary',       unitName: 'g',    isMacronutrient: false },
  { fdcNutrientId: 1258, name: 'Fatty acids, total saturated',unitName: 'g',   isMacronutrient: false },
  { fdcNutrientId: 1093, name: 'Sodium, Na',                 unitName: 'mg',   isMacronutrient: false },
  { fdcNutrientId: 1087, name: 'Calcium, Ca',                unitName: 'mg',   isMacronutrient: false },
  { fdcNutrientId: 1089, name: 'Iron, Fe',                   unitName: 'mg',   isMacronutrient: false },
];

// ── Ingredientes Base (20 alimentos esenciales) ───────────────────────────────
// Datos nutricionales: USDA FoodData Central (valores por 100g de alimento crudo)
// SMAE shortCodes según el catálogo SMAE 4ta edición

const INGREDIENTS: IngredientDef[] = [
  // ── Carnes y Aves ────────────────────────────────────────────────────────
  {
    fdcId: 171477,
    name: 'Pollo, pechuga, sin piel, cruda',
    smaeShortCode: 'AOA-MB',
    equivalentWeight: 30,
    equivalentMeasure: '30g (1 oz aprox.)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 110  },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 23.1 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 1.24 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 0    },
      { fdcNutrientId: 1258, name: 'Fatty acids, total saturated',unitName: 'g',    isMacronutrient: false, amountPer100g: 0.35 },
      { fdcNutrientId: 1093, name: 'Sodium, Na',                  unitName: 'mg',   isMacronutrient: false, amountPer100g: 74   },
    ],
    portions: [
      { description: '1 filete mediano (120g)', gramWeight: 120 },
      { description: '1 pieza chica (90g)', gramWeight: 90 },
    ],
  },
  {
    fdcId: 174032,
    name: 'Res, bistec (lomo), magro, crudo',
    smaeShortCode: 'AOA-B',
    equivalentWeight: 30,
    equivalentMeasure: '30g (1 oz aprox.)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 143  },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 21.4 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 6.1  },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 0    },
      { fdcNutrientId: 1258, name: 'Fatty acids, total saturated',unitName: 'g',    isMacronutrient: false, amountPer100g: 2.4  },
      { fdcNutrientId: 1093, name: 'Sodium, Na',                  unitName: 'mg',   isMacronutrient: false, amountPer100g: 65   },
    ],
    portions: [
      { description: '1 bistec mediano (100g)', gramWeight: 100 },
      { description: '1 porción pequeña (60g)', gramWeight: 60 },
    ],
  },
  {
    fdcId: 174608,
    name: 'Atún, en agua, escurrido',
    smaeShortCode: 'AOA-MB',
    equivalentWeight: 30,
    equivalentMeasure: '30g (2 cucharadas)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 86   },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 19.0 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 0.5  },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 0    },
      { fdcNutrientId: 1093, name: 'Sodium, Na',                  unitName: 'mg',   isMacronutrient: false, amountPer100g: 396  },
      { fdcNutrientId: 1089, name: 'Iron, Fe',                    unitName: 'mg',   isMacronutrient: false, amountPer100g: 1.3  },
    ],
    portions: [
      { description: '1 lata pequeña (140g)', gramWeight: 140 },
      { description: '1/2 lata (70g)', gramWeight: 70 },
    ],
  },

  // ── Huevo ────────────────────────────────────────────────────────────────
  {
    fdcId: 748967,
    name: 'Huevo, entero, crudo, fresco',
    smaeShortCode: 'AOA-MOD',
    equivalentWeight: 63,
    equivalentMeasure: '1 pieza grande',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 143  },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 12.6 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 9.5  },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 0.73 },
      { fdcNutrientId: 1258, name: 'Fatty acids, total saturated',unitName: 'g',    isMacronutrient: false, amountPer100g: 3.1  },
      { fdcNutrientId: 1087, name: 'Calcium, Ca',                 unitName: 'mg',   isMacronutrient: false, amountPer100g: 56   },
      { fdcNutrientId: 1089, name: 'Iron, Fe',                    unitName: 'mg',   isMacronutrient: false, amountPer100g: 1.75 },
    ],
    portions: [
      { description: '1 pieza grande (63g)', gramWeight: 63 },
      { description: '1 pieza mediana (53g)', gramWeight: 53 },
      { description: '1 pieza chica (44g)', gramWeight: 44 },
    ],
  },

  // ── Cereales y Tubérculos ─────────────────────────────────────────────────
  {
    fdcId: 168917,
    name: 'Arroz blanco, crudo',
    smaeShortCode: 'CER-SG',
    equivalentWeight: 20,
    equivalentMeasure: '20g (2 cucharadas crudas)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 365  },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 7.13 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 0.66 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 80.0 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 1.3  },
      { fdcNutrientId: 1089, name: 'Iron, Fe',                    unitName: 'mg',   isMacronutrient: false, amountPer100g: 0.8  },
    ],
    portions: [
      { description: '1/3 taza cocido (70g)', gramWeight: 70 },
      { description: '1/2 taza cocido (105g)', gramWeight: 105 },
    ],
  },
  {
    fdcId: 9192,
    name: 'Avena, hojuelas, seca',
    smaeShortCode: 'CER-SG',
    equivalentWeight: 20,
    equivalentMeasure: '20g (1/4 taza seca)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 389  },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 16.9 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 6.9  },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 66.3 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 10.6 },
      { fdcNutrientId: 1087, name: 'Calcium, Ca',                 unitName: 'mg',   isMacronutrient: false, amountPer100g: 54   },
      { fdcNutrientId: 1089, name: 'Iron, Fe',                    unitName: 'mg',   isMacronutrient: false, amountPer100g: 4.7  },
    ],
    portions: [
      { description: '1/3 taza seca (30g)', gramWeight: 30 },
      { description: '1/2 taza seca (45g)', gramWeight: 45 },
    ],
  },
  {
    fdcId: 169761,
    name: 'Tortilla de maíz, sin grasa',
    smaeShortCode: 'CER-SG',
    equivalentWeight: 30,
    equivalentMeasure: '1 tortilla chica (30g)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 218  },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 5.7  },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 2.85 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 45.9 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 6.3  },
      { fdcNutrientId: 1087, name: 'Calcium, Ca',                 unitName: 'mg',   isMacronutrient: false, amountPer100g: 127  },
    ],
    portions: [
      { description: '1 tortilla chica (30g)', gramWeight: 30 },
      { description: '1 tortilla grande (45g)', gramWeight: 45 },
    ],
  },
  {
    fdcId: 170026,
    name: 'Papa, cruda, sin cáscara',
    smaeShortCode: 'CER-SG',
    equivalentWeight: 90,
    equivalentMeasure: '1/2 pieza mediana',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 77   },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 2.0  },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 0.09 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 17.5 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 2.2  },
      { fdcNutrientId: 1093, name: 'Sodium, Na',                  unitName: 'mg',   isMacronutrient: false, amountPer100g: 6    },
    ],
    portions: [
      { description: '1 pieza mediana (180g)', gramWeight: 180 },
      { description: '1/2 pieza (90g)', gramWeight: 90 },
    ],
  },

  // ── Leguminosas ───────────────────────────────────────────────────────────
  {
    fdcId: 173744,
    name: 'Frijoles negros, cocidos, sin sal',
    smaeShortCode: 'LEG',
    equivalentWeight: 90,
    equivalentMeasure: '1/2 taza cocida (90g)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 132  },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 8.9  },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 0.54 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 23.7 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 8.7  },
      { fdcNutrientId: 1089, name: 'Iron, Fe',                    unitName: 'mg',   isMacronutrient: false, amountPer100g: 2.1  },
    ],
    portions: [
      { description: '1/2 taza cocida (90g)', gramWeight: 90 },
      { description: '1 taza cocida (180g)', gramWeight: 180 },
    ],
  },
  {
    fdcId: 172421,
    name: 'Lentejas, cocidas, sin sal',
    smaeShortCode: 'LEG',
    equivalentWeight: 90,
    equivalentMeasure: '1/2 taza cocida (90g)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 116  },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 9.02 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 0.38 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 20.1 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 7.9  },
      { fdcNutrientId: 1089, name: 'Iron, Fe',                    unitName: 'mg',   isMacronutrient: false, amountPer100g: 3.3  },
    ],
    portions: [
      { description: '1/2 taza cocida (90g)', gramWeight: 90 },
    ],
  },

  // ── Lácteos ───────────────────────────────────────────────────────────────
  {
    fdcId: 746771,
    name: 'Leche, entera, sin modificar',
    smaeShortCode: 'LECHE-E',
    equivalentWeight: 240,
    equivalentMeasure: '1 taza (240ml)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 61   },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 3.15 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 3.25 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 4.78 },
      { fdcNutrientId: 1087, name: 'Calcium, Ca',                 unitName: 'mg',   isMacronutrient: false, amountPer100g: 113  },
    ],
    portions: [
      { description: '1 taza (240ml)', gramWeight: 240 },
      { description: '1/2 taza (120ml)', gramWeight: 120 },
    ],
  },
  {
    fdcId: 170887,
    name: 'Queso panela bajo en grasa',
    smaeShortCode: 'AOA-B',
    equivalentWeight: 30,
    equivalentMeasure: '1 rebanada (30g)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 90   },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 9.5  },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 4.0  },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 2.5  },
      { fdcNutrientId: 1087, name: 'Calcium, Ca',                 unitName: 'mg',   isMacronutrient: false, amountPer100g: 270  },
    ],
    portions: [
      { description: '1 rebanada (30g)', gramWeight: 30 },
      { description: '2 rebanadas (60g)', gramWeight: 60 },
    ],
  },

  // ── Frutas ────────────────────────────────────────────────────────────────
  {
    fdcId: 168202,
    name: 'Manzana, roja, con cáscara, cruda',
    smaeShortCode: 'FRU',
    equivalentWeight: 90,
    equivalentMeasure: '1/2 pieza mediana',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 52   },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 0.26 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 0.17 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 13.8 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 2.4  },
      { fdcNutrientId: 1087, name: 'Calcium, Ca',                 unitName: 'mg',   isMacronutrient: false, amountPer100g: 6    },
    ],
    portions: [
      { description: '1 pieza mediana (182g)', gramWeight: 182 },
      { description: '1/2 pieza (91g)', gramWeight: 91 },
    ],
  },
  {
    fdcId: 169918,
    name: 'Plátano, crudo',
    smaeShortCode: 'FRU',
    equivalentWeight: 65,
    equivalentMeasure: '1/2 pieza (65g)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 89   },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 1.09 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 0.33 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 22.8 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 2.6  },
    ],
    portions: [
      { description: '1 pieza mediana (118g)', gramWeight: 118 },
      { description: '1/2 pieza (59g)', gramWeight: 59 },
    ],
  },

  // ── Verduras ──────────────────────────────────────────────────────────────
  {
    fdcId: 170393,
    name: 'Brócoli, crudo',
    smaeShortCode: 'VER',
    equivalentWeight: 100,
    equivalentMeasure: '1 taza (100g)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 34   },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 2.82 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 0.37 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 6.64 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 2.6  },
      { fdcNutrientId: 1087, name: 'Calcium, Ca',                 unitName: 'mg',   isMacronutrient: false, amountPer100g: 47   },
    ],
    portions: [
      { description: '1 taza (91g)', gramWeight: 91 },
      { description: '1/2 taza florets (44g)', gramWeight: 44 },
    ],
  },
  {
    fdcId: 169967,
    name: 'Espinacas, crudas',
    smaeShortCode: 'VER',
    equivalentWeight: 100,
    equivalentMeasure: '2 tazas (100g)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 23   },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 2.86 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 0.39 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 3.63 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 2.2  },
      { fdcNutrientId: 1087, name: 'Calcium, Ca',                 unitName: 'mg',   isMacronutrient: false, amountPer100g: 99   },
      { fdcNutrientId: 1089, name: 'Iron, Fe',                    unitName: 'mg',   isMacronutrient: false, amountPer100g: 2.71 },
    ],
    portions: [
      { description: '2 tazas crudas (60g)', gramWeight: 60 },
      { description: '1/2 taza cocida (90g)', gramWeight: 90 },
    ],
  },

  // ── Grasas y Aceites ──────────────────────────────────────────────────────
  {
    fdcId: 171413,
    name: 'Aceite de oliva, extra virgen',
    smaeShortCode: 'GRASA-SP',
    equivalentWeight: 5,
    equivalentMeasure: '1 cucharadita (5ml)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 884  },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 0    },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 100  },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 0    },
      { fdcNutrientId: 1258, name: 'Fatty acids, total saturated',unitName: 'g',    isMacronutrient: false, amountPer100g: 13.8 },
    ],
    portions: [
      { description: '1 cucharadita (5ml)', gramWeight: 5 },
      { description: '1 cucharada (15ml)', gramWeight: 15 },
    ],
  },
  {
    fdcId: 171706,
    name: 'Aguacate, Hass, crudo',
    smaeShortCode: 'GRASA-CP',
    equivalentWeight: 30,
    equivalentMeasure: '1/8 de pieza (30g)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 160  },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 2.0  },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 14.7 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 8.53 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 6.7  },
      { fdcNutrientId: 1258, name: 'Fatty acids, total saturated',unitName: 'g',    isMacronutrient: false, amountPer100g: 2.13 },
    ],
    portions: [
      { description: '1/2 pieza (75g)', gramWeight: 75 },
      { description: '1 pieza entera (150g)', gramWeight: 150 },
    ],
  },

  // ── Semillas y Frutos secos ───────────────────────────────────────────────
  {
    fdcId: 170562,
    name: 'Almendras, tostadas, sin sal',
    smaeShortCode: 'GRASA-CP',
    equivalentWeight: 15,
    equivalentMeasure: '12 piezas (15g)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 607  },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 21.2 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 52.5 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 21.6 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 10.9 },
      { fdcNutrientId: 1087, name: 'Calcium, Ca',                 unitName: 'mg',   isMacronutrient: false, amountPer100g: 264  },
    ],
    portions: [
      { description: '12 piezas aprox. (15g)', gramWeight: 15 },
      { description: '23 piezas 1oz (28g)', gramWeight: 28 },
    ],
  },
  {
    fdcId: 169414,
    name: 'Semillas de chía, secas',
    smaeShortCode: 'GRASA-CP',
    equivalentWeight: 15,
    equivalentMeasure: '1 cucharada (15g)',
    nutrients: [
      { fdcNutrientId: 1008, name: 'Energy',                    unitName: 'kcal', isMacronutrient: true,  amountPer100g: 486  },
      { fdcNutrientId: 1003, name: 'Protein',                    unitName: 'g',    isMacronutrient: true,  amountPer100g: 16.5 },
      { fdcNutrientId: 1004, name: 'Total lipid (fat)',           unitName: 'g',    isMacronutrient: true,  amountPer100g: 30.7 },
      { fdcNutrientId: 1005, name: 'Carbohydrate, by difference', unitName: 'g',    isMacronutrient: true,  amountPer100g: 42.1 },
      { fdcNutrientId: 1079, name: 'Fiber, total dietary',        unitName: 'g',    isMacronutrient: false, amountPer100g: 34.4 },
      { fdcNutrientId: 1087, name: 'Calcium, Ca',                 unitName: 'mg',   isMacronutrient: false, amountPer100g: 631  },
      { fdcNutrientId: 1089, name: 'Iron, Fe',                    unitName: 'mg',   isMacronutrient: false, amountPer100g: 7.72 },
    ],
    portions: [
      { description: '1 cucharada (15g)', gramWeight: 15 },
      { description: '2 cucharadas (28g)', gramWeight: 28 },
    ],
  },
];

// ── Función principal de seeding ──────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🌱 ATLEET — Seed de Ingredientes Base (Starter Kit)        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // ── Paso 1: Upsert del catálogo de nutrientes ─────────────────────────────
  console.log('📦 Paso 1/3: Sincronizando catálogo de nutrientes...');
  const nutrientIdMap = new Map<number, string>(); // fdcNutrientId → nutrient.id (UUID)

  for (const n of NUTRIENT_CATALOG) {
    const nutrient = await prisma.nutrient.upsert({
      where: { fdcNutrientId: n.fdcNutrientId },
      update: { name: n.name, unitName: n.unitName, isMacronutrient: n.isMacronutrient },
      create: { fdcNutrientId: n.fdcNutrientId, name: n.name, unitName: n.unitName, isMacronutrient: n.isMacronutrient },
    });
    nutrientIdMap.set(n.fdcNutrientId, nutrient.id);
  }
  console.log(`   ✅ ${nutrientIdMap.size} nutrientes sincronizados`);

  // ── Paso 2: Obtener UUIDs de las SmaeCategories ───────────────────────────
  console.log('📦 Paso 2/3: Verificando SmaeCategories en la BD...');
  const allSmaeCategories = await prisma.smaeCategory.findMany({
    select: { id: true, shortCode: true, name: true },
  });

  if (allSmaeCategories.length === 0) {
    console.error('❌ ERROR: La tabla SmaeCategory está vacía.');
    console.error('   Ejecuta primero: npm run db:seed');
    process.exit(1);
  }

  const smaeCategoryMap = new Map(allSmaeCategories.map((c) => [c.shortCode, c]));
  console.log(`   ✅ ${allSmaeCategories.length} categorías SMAE disponibles`);

  // ── Paso 3: Upsert de ingredientes ───────────────────────────────────────
  console.log('📦 Paso 3/3: Insertando ingredientes...');
  console.log('');

  let createdCount = 0;
  let skippedCount = 0;

  for (const ingredient of INGREDIENTS) {
    const smaeCategory = smaeCategoryMap.get(ingredient.smaeShortCode);

    if (!smaeCategory) {
      console.warn(`   ⚠️  SmaeCategory "${ingredient.smaeShortCode}" no encontrada — saltando "${ingredient.name}"`);
      skippedCount++;
      continue;
    }

    // Upsert del ingrediente base
    const created = await prisma.ingredient.upsert({
      where: { fdcId: ingredient.fdcId },
      update: { name: ingredient.name },
      create: {
        fdcId: ingredient.fdcId,
        name: ingredient.name,
        dataSource: DataSource.USDA,
      },
    });

    // Upsert de nutrientes (pivote ingredient_nutrients)
    for (const nutrient of ingredient.nutrients) {
      const nutrientId = nutrientIdMap.get(nutrient.fdcNutrientId);
      if (!nutrientId) continue;

      await prisma.ingredientNutrient.upsert({
        where: {
          ingredientId_nutrientId: {
            ingredientId: created.id,
            nutrientId,
          },
        },
        update: { amountPer100g: nutrient.amountPer100g },
        create: {
          ingredientId: created.id,
          nutrientId,
          amountPer100g: nutrient.amountPer100g,
        },
      });
    }

    // Upsert de porciones
    for (const portion of ingredient.portions) {
      // Las porciones no tienen unique constraint natural — verificamos por descripción
      const existing = await prisma.ingredientPortion.findFirst({
        where: { ingredientId: created.id, description: portion.description },
      });
      if (!existing) {
        await prisma.ingredientPortion.create({
          data: {
            ingredientId: created.id,
            description: portion.description,
            gramWeight: portion.gramWeight,
          },
        });
      }
    }

    // Upsert del mapeo SMAE
    await prisma.smaeMapping.upsert({
      where: { ingredientId: created.id },
      update: {
        categoryId: smaeCategory.id,
        equivalentWeight: ingredient.equivalentWeight,
        measure: ingredient.equivalentMeasure,
      },
      create: {
        ingredientId: created.id,
        categoryId: smaeCategory.id,
        equivalentWeight: ingredient.equivalentWeight,
        measure: ingredient.equivalentMeasure,
      },
    });

    const action = createdCount === 0 ? 'creado' : 'creado';
    console.log(`   ✅ [${ingredient.smaeShortCode}] ${ingredient.name} — ${action}`);
    createdCount++;
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║   ✅ Seed completado: ${createdCount} ingredientes | ${skippedCount} omitidos`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
}

main()
  .catch((error) => {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
