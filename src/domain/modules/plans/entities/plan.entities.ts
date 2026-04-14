/**
 * DOMINIO — Entidades del Constructor de Planes (Fase 5)
 * Interfaces puras de dominio. Sin dependencias externas.
 *
 * REGLA DE DOMINIO — Selección Híbrida:
 *   Toda MealSelectionEntity DEBE cumplir EXACTAMENTE una de estas condiciones:
 *   1. Tiene `ingredientId` (+ `consumedGrams` o `portionId` con `portionQty`).
 *   2. Tiene `smaeCategoryId` (+ `smaeEquivalents`).
 *   Esta invariante se garantiza en la capa de aplicación (Zod), NO en SQL.
 */

// ── Value Objects ─────────────────────────────────────────────────────────────

/** Resumen de macros totales calculados para una comida o un plan completo. */
export interface MacroSummary {
  kcal: number;
  proteins: number;
  carbs: number;
  fats: number;
}

// ── MealSelection ─────────────────────────────────────────────────────────────

/**
 * Modo de resolución de cantidad para una selección exacta (Caso A).
 *   - 'grams'   → Se usa `consumedGrams` directamente.
 *   - 'portion' → Se resuelve con `IngredientPortion.gramWeight × portionQty`.
 */
export type QuantityMode = 'grams' | 'portion';

/**
 * Indica el tipo de referencia de la selección.
 *   - 'ingredient' → Apunta a un ingrediente exacto (USDA/CUSTOM/Verified).
 *   - 'smae'       → Apunta a un grupo teórico SMAE sin ingrediente específico.
 */
export type SelectionType = 'ingredient' | 'smae';

/** Entidad de Dominio: Selección de un alimento dentro de una Meal. */
export interface MealSelectionEntity {
  id: string;
  mealId: string;

  // ── Referencia (mutuamente excluyente a nivel de dominio) ─────────────────
  type: SelectionType;
  /** Presente solo si type === 'ingredient' */
  ingredientId?: string;
  /** Presente solo si type === 'smae' */
  smaeCategoryId?: string;

  // ── Cantidad ──────────────────────────────────────────────────────────────
  /** Modo en que se expresa la cantidad para ingredientes (type === 'ingredient'). */
  quantityMode?: QuantityMode;

  /** Modo 'grams': gramos exactos del ingrediente. */
  consumedGrams?: number;

  /** Modo 'portion': ID de la porción referenciada (ej: "1 taza de avena = 80g"). */
  portionId?: string;
  /** Modo 'portion': número de porciones (puede ser decimal, ej: 1.5). */
  portionQty?: number;

  /**
   * Equivalentes SMAE.
   * - Obligatorio si type === 'smae'.
   * - Opcional si type === 'ingredient' (se recalculan desde gramos si hay SmaeMapping).
   */
  smaeEquivalents?: number;

  // ── Metadatos ──────────────────────────────────────────────────────────────
  /** Indicaciones de preparación (Ej: "Sin piel", "Al vapor"). */
  notes?: string;
}

// ── Meal ──────────────────────────────────────────────────────────────────────

/** Entidad de Dominio: División lógica del día dentro de un NutritionPlan. */
export interface MealEntity {
  id: string;
  nutritionPlanId: string;
  name: string;
  /** Orden cronológico dentro del plan (1=primero, n=último). */
  order: number;
  /** Hora sugerida en formato HH:MM, ej: "08:00". */
  time?: string | null;
  selections: MealSelectionEntity[];
}

// ── NutritionPlan ─────────────────────────────────────────────────────────────

/** Entidad de Dominio: Contenedor diario del plan nutricional. */
export interface NutritionPlanEntity {
  id: string;
  name: string;
  description?: string | null;

  /** Metas opcionales del dietista. Se comparan contra los totales calculados. */
  targets?: {
    kcal?: number;
    proteins?: number;
    carbs?: number;
    fats?: number;
  } | null;

  meals: MealEntity[];
  createdAt: Date;
  updatedAt: Date;
}

/** Versión ligera para listados/búsqueda; sin meals ni selections anidadas. */
export interface NutritionPlanSummary {
  id: string;
  name: string;
  description?: string | null;
  mealCount: number;
  createdAt: Date;
}
