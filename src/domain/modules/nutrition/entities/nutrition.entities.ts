/**
 * DOMINIO — Entidades de Nutrición
 * Interfaces puras de la Biblia Técnica de Atleet.
 * Sin dependencias externas (ni Prisma, ni Express, ni Zod).
 *
 * Principio: "Los gramos son la fuente de verdad."
 * Los equivalentes SMAE son siempre valores derivados.
 */

// ── Value Object: Grams ───────────────────────────────────────────────────────

/**
 * Alias semántico para dejar explícito en las firmas de funciones
 * que un `number` representa gramos. Previene confusiones con
 * equivalentes u otras unidades.
 *
 * @example
 *   function calculate(amount: Grams): MetabolicResult { ... }
 */
export type Grams = number;

// ── Interfaces del Motor Metabólico (Motor USDA) ─────────────────────────────

/** Impacto de un nutriente específico para una cantidad consumida. */
export interface NutrientImpact {
  nutrientId: string;
  nutrientName: string;
  unit: string;
  /** Calculado con: (amountPer100g / 100) * consumedGrams */
  calculatedAmount: number;
  isMacronutrient: boolean;
}

/**
 * Resultado completo del Motor USDA ("Precisión Inteligente").
 * Requiere un ingrediente concreto con perfil FDC.
 * Los gramos son la fuente de verdad; los equivalentes SMAE son derivados.
 */
export interface MetabolicResult {
  ingredientId: string;
  ingredientName: string;
  consumedGrams: Grams;
  /** Null si el ingrediente no tiene mapeo SMAE asignado */
  smaeEquivalents: number | null;
  smaeCategory: string | null;
  macros: {
    carbs: number;
    proteins: number;
    fats: number;
    kcal: number;
  };
  nutrients: NutrientImpact[];
}

// ── Interfaces del Motor SMAE ─────────────────────────────────────────────────

/**
 * Resultado del Motor SMAE Directo.
 * Se usa cuando el dietista trabaja con equivalentes teóricos sin
 * necesidad de un ingrediente específico ("2 equivalentes de Fruta").
 */
export interface SmaeCategoryImpact {
  categoryId: string;
  categoryName: string;
  shortCode: string;
  equivalents: number;
  /** Gramos totales consumidos = equivalents × equivalentWeight (si aplica) */
  referenceGrams: Grams | null;
  macros: {
    carbs: number;
    proteins: number;
    fats: number;
    kcal: number;
  };
}

// ── Entidad: Ingredient ───────────────────────────────────────────────────────

export type DataSource = 'USDA' | 'CUSTOM';

export interface IngredientNutrientEntity {
  nutrientId: string;
  nutrientName: string;
  unitName: string;
  amountPer100g: number;
  isMacronutrient: boolean;
}

export interface IngredientPortionEntity {
  id: string;
  description: string;
  gramWeight: number;
}

export interface SmaeMappingEntity {
  categoryId: string;
  categoryName: string;
  shortCode: string;
  equivalentWeight: number;
  measure: string;
}

/** Entidad completa del ingrediente con todas sus relaciones. */
export interface IngredientEntity {
  id: string;
  fdcId?: number | null;
  dataSource: DataSource;
  name: string;
  scientificName?: string | null;
  brandOwner?: string | null;
  nutrients: IngredientNutrientEntity[];
  portions: IngredientPortionEntity[];
  smaeMapping?: SmaeMappingEntity | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Versión ligera para listados y búsquedas. */
export interface IngredientSummary {
  id: string;
  fdcId?: number | null;
  dataSource: DataSource;
  name: string;
  hasSmaeMapping: boolean;
}

// ── Entidad: SmaeCategory ─────────────────────────────────────────────────────

export interface SmaeCategoryEntity {
  id: string;
  name: string;
  shortCode: string;
  avgCarbs: number;
  avgProteins: number;
  avgFats: number;
  avgKcal: number;
}

// ── Entidad: SearchResult (resultado unificado del buscador) ──────────────────

/**
 * Discriminated union que unifica los resultados del buscador.
 * Permite al frontend distinguir el tipo de resultado y renderizar
 * la UI correcta (tarjeta de ingrediente vs tarjeta de categoría SMAE).
 */
export type SearchResultSource =
  | 'ingredient'    // Ingrediente en la base de datos local
  | 'smae_local'    // Categoría SMAE (grupo teórico, no un ingrediente específico)
  | 'usda';         // Resultado de la API USDA FoodData Central

export interface SearchResult {
  /** Discriminador de la fuente de datos */
  source: SearchResultSource;
  id: string;
  name: string;
  /** Solo presente en source='ingredient' */
  fdcId?: number | null;
  /** Solo presente en source='ingredient' */
  hasSmaeMapping?: boolean;
  /** Solo presente en source='smae_local' */
  shortCode?: string;
  /** Solo presente en source='smae_local' */
  avgKcal?: number;
}
