/**
 * INFRAESTRUCTURA — Tipos de la USDA FoodData Central API
 * Espeja exactamente la estructura JSON de los endpoints:
 *   GET /fdc/v1/foods/search
 *
 * Referencia oficial: https://fdc.nal.usda.gov/api-guide.html
 *
 * IMPORTANTE: Estos tipos son SOLO para la capa de infraestructura.
 * La capa de dominio usa UsdaSearchResult/UsdaNutrient (de nutrition.repositories.ts).
 */

// ── Respuesta de /foods/search ─────────────────────────────────────────────────

export interface UsdaApiSearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  pageList: number[];
  foodSearchCriteria: {
    query: string;
    pageSize: number;
    pageNumber: number;
  };
  foods: UsdaApiFood[];
}

// ── Alimento individual ────────────────────────────────────────────────────────

export interface UsdaApiFood {
  fdcId: number;
  description: string;
  /** Solo presente en alimentos de marca */
  brandOwner?: string;
  brandName?: string;
  /** 'Foundation', 'SR Legacy', 'Branded', 'Survey (FNDDS)', 'Experimental' */
  dataType: string;
  /** Código de categoría del alimento */
  foodCategory?: string;
  foodCategoryId?: number;
  publishedDate?: string;
  score?: number;
  foodNutrients: UsdaApiFoodNutrient[];
  /** Porciones de referencia (no siempre presentes) */
  finalFoodInputFoods?: UsdaApiInputFood[];
  foodMeasures?: UsdaApiFoodMeasure[];
}

// ── Nutriente en el contexto de un alimento ───────────────────────────────────

export interface UsdaApiFoodNutrient {
  /** ID único del nutriente en la DB de la USDA */
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  /** Unidad de medida: g, mg, µg, kcal, IU, etc. */
  unitName: string;
  /** Tipo de derivación del valor */
  derivationCode?: string;
  derivationDescription?: string;
  /** Valor por 100g — puede ser undefined si no hay dato */
  value?: number;
  /** Solo presente en alimentos de tipo 'Branded' */
  rank?: number;
  indentLevel?: number;
  foodNutrientId?: number;
  percentDailyValue?: number;
}

// ── Porción de referencia ─────────────────────────────────────────────────────

export interface UsdaApiFoodMeasure {
  disseminationText: string;
  gramWeight: number;
  id: number;
  modifier: string;
  rank: number;
  sequenceNumber: number;
}

export interface UsdaApiInputFood {
  foodDescription: string;
  inputFood: {
    fdcId: number;
    description: string;
  };
}
