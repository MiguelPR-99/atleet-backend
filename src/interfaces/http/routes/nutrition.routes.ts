/**
 * INTERFACES — Rutas de Nutrición
 * Wiring completo: Repositorios + Gateway USDA → Use Cases → Controller → Router.
 *
 * Endpoints expuestos bajo /api:
 *   GET  /api/nutrition/search?q=&limit=&includeSmae=&includeUsda=
 *   POST /api/nutrition/calculate/metabolic
 *   POST /api/nutrition/calculate/smae
 *   GET  /api/nutrition/smae/categories
 *
 * DI Chain (Fase 3):
 *   PrismaClient   → PrismaIngredientRepository ─┐
 *   PrismaClient   → PrismaSmaeRepository        ─┤→ SearchIngredientUseCase
 *   env + fetch    → UsdaIngredientGateway       ─┘
 */

import { Router } from 'express';
import { env } from '../../../shared/config/env';
import { prisma } from '../../../infrastructure/database/prisma.client';
import { PrismaIngredientRepository } from '../../../infrastructure/modules/nutrition/repositories/PrismaIngredientRepository';
import { PrismaSmaeRepository } from '../../../infrastructure/modules/nutrition/repositories/PrismaSmaeRepository';
import { UsdaIngredientGateway } from '../../../infrastructure/external/usda/UsdaIngredientGateway';
import { CalculateMetabolicImpactUseCase } from '../../../application/modules/nutrition/use-cases/CalculateMetabolicImpact';
import { CalculateSmaeImpactUseCase } from '../../../application/modules/nutrition/use-cases/CalculateSmaeImpact';
import { SearchIngredientUseCase } from '../../../application/modules/nutrition/use-cases/SearchIngredient';
import { GetSmaeCategoriesUseCase } from '../../../application/modules/nutrition/use-cases/GetSmaeCategories';
import { NutritionController } from '../controllers/NutritionController';

// ── Composición de dependencias ───────────────────────────────────────────────

// Capa de datos — local
const ingredientRepo = new PrismaIngredientRepository(prisma);
const smaeRepo = new PrismaSmaeRepository(prisma);

// Capa de datos — externa (USDA FoodData Central)
const usdaGateway = new UsdaIngredientGateway({
  baseUrl: env.USDA_BASE_URL,
  apiKey: env.USDA_API_KEY,
  timeoutMs: 3000, // 3 segundos — degradación silenciosa si timeout
});

// Use cases
const calculateMetabolicUseCase = new CalculateMetabolicImpactUseCase(ingredientRepo);
const calculateSmaeUseCase = new CalculateSmaeImpactUseCase(smaeRepo);
const searchUseCase = new SearchIngredientUseCase(ingredientRepo, smaeRepo, usdaGateway);
const getSmaeCategoriesUseCase = new GetSmaeCategoriesUseCase(smaeRepo);

// Controller
const controller = new NutritionController(
  calculateMetabolicUseCase,
  calculateSmaeUseCase,
  searchUseCase,
  getSmaeCategoriesUseCase,
);

// ── Router ────────────────────────────────────────────────────────────────────
const router = Router();

/**
 * GET /api/nutrition/search?q=apple&limit=10&includeSmae=true&includeUsda=true
 * Buscador unificado: ingredientes locales + categorías SMAE + USDA FDC.
 * Cada resultado incluye discriminador `source`: 'ingredient' | 'smae_local' | 'usda'
 */
router.get('/nutrition/search', controller.search);

/**
 * POST /api/nutrition/calculate/metabolic
 * Motor USDA — Calcula micros y macros exactos usando perfil FDC.
 * Body: { ingredientId: UUID, consumedGrams?: number, smaeEquivalents?: number }
 */
router.post('/nutrition/calculate/metabolic', controller.calculateMetabolic);

/**
 * POST /api/nutrition/calculate/smae
 * Motor SMAE Directo — Calcula macros teóricos del grupo sin ingrediente.
 * Body: { shortCode?: string, categoryId?: UUID, equivalents: number }
 */
router.post('/nutrition/calculate/smae', controller.calculateSmae);

/**
 * GET /api/nutrition/smae/categories
 * Catálogo completo de 22 grupos SMAE (4ta Edición).
 */
router.get('/nutrition/smae/categories', controller.listSmaeCategories);

export { router as nutritionRouter };
