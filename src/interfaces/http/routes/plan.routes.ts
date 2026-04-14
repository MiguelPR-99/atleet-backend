/**
 * INTERFACES — Rutas de Planes Nutricionales
 * Wiring completo: Repositorios → Use Cases → Controller → Router.
 *
 * Endpoints expuestos bajo /api:
 *   POST  /api/plans                      → Crear plan vacío
 *   GET   /api/plans                      → Listar todos los planes (resumen)
 *   GET   /api/plans/:planId              → Obtener plan completo con meals
 *   POST  /api/plans/:planId/meals        → Añadir comida a un plan
 *   POST  /api/meals/:mealId/selections   → Añadir selección (ingrediente o SMAE)
 *   GET   /api/meals/:mealId/totals       → Calcular macros totales de la comida
 *
 * DI Chain (Fase 5):
 *   PrismaClient → PrismaNutritionPlanRepository ─┐
 *   PrismaClient → PrismaMealRepository           ─┤→ Use Cases → PlanController
 *   PrismaClient → PrismaMealSelectionRepository  ─┘
 *   PrismaClient → PrismaIngredientRepository     ─→ AddSelectionToMeal
 *   PrismaClient → PrismaSmaeRepository           ─→ CalculateMealTotals
 */

import { Router } from 'express';
import { prisma } from '../../../infrastructure/database/prisma.client';

// ── Repositorios ───────────────────────────────────────────────────────────────
import { PrismaNutritionPlanRepository } from '../../../infrastructure/modules/plans/repositories/PrismaNutritionPlanRepository';
import { PrismaMealRepository } from '../../../infrastructure/modules/plans/repositories/PrismaMealRepository';
import { PrismaMealSelectionRepository } from '../../../infrastructure/modules/plans/repositories/PrismaMealSelectionRepository';
import { PrismaIngredientRepository } from '../../../infrastructure/modules/nutrition/repositories/PrismaIngredientRepository';
import { PrismaSmaeRepository } from '../../../infrastructure/modules/nutrition/repositories/PrismaSmaeRepository';

// ── Use Cases — Plan Builder ───────────────────────────────────────────────────
import { CreatePlanUseCase } from '../../../application/modules/plans/use-cases/CreatePlan';
import { AddMealToPlanUseCase } from '../../../application/modules/plans/use-cases/AddMealToPlan';
import { AddSelectionToMealUseCase } from '../../../application/modules/plans/use-cases/AddSelectionToMeal';
import { CalculateMealTotalsUseCase } from '../../../application/modules/plans/use-cases/CalculateMealTotals';

// ── Use Cases — Motor Metabólico (reutilizados por CalculateMealTotals) ────────
import { CalculateMetabolicImpactUseCase } from '../../../application/modules/nutrition/use-cases/CalculateMetabolicImpact';
import { CalculateSmaeImpactUseCase } from '../../../application/modules/nutrition/use-cases/CalculateSmaeImpact';

// ── Controller ────────────────────────────────────────────────────────────────
import { PlanController } from '../controllers/PlanController';

// ──────────────────────────────────────────────────────────────────────────────
// COMPOSICIÓN DE DEPENDENCIAS
// ──────────────────────────────────────────────────────────────────────────────

// Repositorios de infraestructura
const planRepo = new PrismaNutritionPlanRepository(prisma);
const mealRepo = new PrismaMealRepository(prisma);
const selectionRepo = new PrismaMealSelectionRepository(prisma);
const ingredientRepo = new PrismaIngredientRepository(prisma);
const smaeRepo = new PrismaSmaeRepository(prisma);

// Motores metabólicos existentes (reutilizados en el orquestador)
const calculateMetabolicUseCase = new CalculateMetabolicImpactUseCase(ingredientRepo);
const calculateSmaeUseCase = new CalculateSmaeImpactUseCase(smaeRepo);

// Use Cases del Plan Builder
const createPlanUseCase = new CreatePlanUseCase(planRepo);
const addMealToPlanUseCase = new AddMealToPlanUseCase(planRepo, mealRepo);
const addSelectionToMealUseCase = new AddSelectionToMealUseCase(
  mealRepo,
  selectionRepo,
  ingredientRepo,
);
const calculateMealTotalsUseCase = new CalculateMealTotalsUseCase(
  mealRepo,
  calculateMetabolicUseCase,
  calculateSmaeUseCase,
);

// Controller
const controller = new PlanController(
  createPlanUseCase,
  addMealToPlanUseCase,
  addSelectionToMealUseCase,
  calculateMealTotalsUseCase,
  planRepo,
);

// ──────────────────────────────────────────────────────────────────────────────
// ROUTER
// ──────────────────────────────────────────────────────────────────────────────
const router = Router();

/**
 * POST /api/plans
 * Crea un plan nutricional vacío.
 * Body: { name: string, description?: string, targets?: { kcal?, proteins?, carbs?, fats? } }
 */
router.post('/plans', controller.createPlan);

/**
 * GET /api/plans
 * Lista todos los planes (versión ligera, sin meals anidadas).
 */
router.get('/plans', controller.listPlans);

/**
 * GET /api/plans/:planId
 * Devuelve el plan completo con todas sus meals y selecciones.
 */
router.get('/plans/:planId', controller.getPlan);

/**
 * POST /api/plans/:planId/meals
 * Añade una comida al plan especificado.
 * Body: { name: string, order?: number, time?: "HH:MM" }
 * Nota: nutritionPlanId se toma del parámetro :planId (no del body).
 */
router.post('/plans/:planId/meals', controller.addMealToPlan);

/**
 * POST /api/meals/:mealId/selections
 * Añade una selección de alimento a la comida especificada.
 * Body (Caso A — Gramos):
 *   { ingredientId: UUID, consumedGrams: number, notes?: string }
 * Body (Caso A — Porción):
 *   { ingredientId: UUID, portionId: UUID, portionQty: number, notes?: string }
 * Body (Caso B — SMAE Teórico):
 *   { smaeCategoryId: UUID, smaeEquivalents: number, notes?: string }
 * Nota: mealId se toma del parámetro :mealId (no del body).
 */
router.post('/meals/:mealId/selections', controller.addSelectionToMeal);

/**
 * GET /api/meals/:mealId/totals
 * Calcula y devuelve el resumen de macros de todas las selecciones de la comida.
 * Usa el orquestador CalculateMealTotals (motores USDA + SMAE).
 */
router.get('/meals/:mealId/totals', controller.getMealTotals);

export { router as planRouter };
