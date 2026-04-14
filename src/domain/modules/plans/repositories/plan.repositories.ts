/**
 * DOMINIO — Contratos de Repositorios del Módulo de Planes (Fase 5)
 * Interfaces puras. La infraestructura (PrismaXxxRepository) las implementa.
 * Los Use Cases SOLO dependen de estas interfaces, nunca de Prisma directamente.
 */

import type {
  NutritionPlanEntity,
  NutritionPlanSummary,
  MealEntity,
  MealSelectionEntity,
} from '../entities/plan.entities';

// ── INutritionPlanRepository ──────────────────────────────────────────────────

export interface INutritionPlanRepository {
  /** Devuelve el plan completo con todas sus Meals y Selections anidadas. */
  findByIdWithRelations(planId: string): Promise<NutritionPlanEntity | null>;

  /** Devuelve la lista ligera de planes (sin meals anidadas). */
  findAll(): Promise<NutritionPlanSummary[]>;

  /** Crea un plan vacío (sin meals todavía). */
  create(
    data: Omit<NutritionPlanEntity, 'id' | 'meals' | 'createdAt' | 'updatedAt'>,
  ): Promise<NutritionPlanEntity>;

  /** Actualiza nombre, descripción o metas macros de un plan existente. */
  update(
    planId: string,
    data: Partial<Omit<NutritionPlanEntity, 'id' | 'meals' | 'createdAt' | 'updatedAt'>>,
  ): Promise<NutritionPlanEntity>;

  /** Elimina el plan y en cascada sus Meals y MealSelections. */
  delete(planId: string): Promise<void>;
}

// ── IMealRepository ───────────────────────────────────────────────────────────

export interface IMealRepository {
  /** Devuelve la comida con sus MealSelections anidadas. */
  findByIdWithSelections(mealId: string): Promise<MealEntity | null>;

  /** Crea una nueva comida dentro de un plan. */
  create(
    data: Omit<MealEntity, 'id' | 'selections'>,
  ): Promise<MealEntity>;

  /** Actualiza nombre, orden u hora de la comida. */
  update(
    mealId: string,
    data: Partial<Omit<MealEntity, 'id' | 'nutritionPlanId' | 'selections'>>,
  ): Promise<MealEntity>;

  /** Elimina la comida y en cascada sus MealSelections. */
  delete(mealId: string): Promise<void>;
}

// ── IMealSelectionRepository ──────────────────────────────────────────────────

export interface IMealSelectionRepository {
  /** Crea una nueva selección dentro de una comida. */
  create(data: Omit<MealSelectionEntity, 'id'>): Promise<MealSelectionEntity>;

  /** Permite cambiar la cantidad o las notas de una selección. */
  update(
    selectionId: string,
    data: Partial<Omit<MealSelectionEntity, 'id' | 'mealId' | 'type'>>,
  ): Promise<MealSelectionEntity>;

  /** Elimina una selección de la comida. */
  delete(selectionId: string): Promise<void>;
}
