/**
 * INFRAESTRUCTURA — UsdaMapper
 * Convierte la respuesta cruda de la API USDA (`UsdaApiFood`)
 * a la entidad de dominio (`UsdaSearchResult`).
 *
 * Reglas de mapeo:
 *   - Los valores de nutrientes ya vienen por 100g en la USDA — se trasladan directo.
 *   - Se filtran nutrientes con `value` undefined, null o negativo.
 *   - Los nutrientes marcados como macros por ID conocido se etiquetan `isMacronutrient: true`.
 *   - El nombre del alimento se limpia de caracteres extraños (uppercase, comas dobles).
 */

import type { UsdaApiFood, UsdaApiFoodNutrient } from './usda.types';
import type { UsdaSearchResult, UsdaNutrient } from '../../../domain/modules/nutrition/repositories/nutrition.repositories';

// ── IDs de Macronutrientes Clave de USDA FDC ──────────────────────────────────
// Fuente: https://fdc.nal.usda.gov/food-details/1097512/nutrients (Nutrient IDs standard)
const MACRO_NUTRIENT_IDS = new Set([
  1008, // Energy (kcal)
  1003, // Protein
  1004, // Total lipid (fat)
  1005, // Carbohydrate, by difference
  2047, // Energy (kcal) — variante en algunos registros Branded
  2048, // Energy (kJ)
  1079, // Fiber, total dietary
  1085, // Fatty acids, total monounsaturated
  1086, // Fatty acids, total polyunsaturated
  1258, // Fatty acids, total saturated
]);

// ── Mapper ────────────────────────────────────────────────────────────────────

export class UsdaMapper {
  /**
   * Convierte un array de alimentos USDA a entidades de dominio.
   * Filtra resultados con menos de 3 nutrientes (datos incompletos).
   */
  static mapFoods(foods: UsdaApiFood[]): UsdaSearchResult[] {
    return foods
      .map(UsdaMapper.mapFood)
      .filter((f) => f.foodNutrients.length >= 3); // Descarte de registros incompletos
  }

  /**
   * Mapea un único alimento USDA a la entidad de dominio.
   */
  static mapFood(food: UsdaApiFood): UsdaSearchResult {
    return {
      fdcId: food.fdcId,
      description: UsdaMapper.cleanDescription(food.description),
      brandOwner: food.brandOwner ?? food.brandName,
      dataType: food.dataType,
      foodNutrients: UsdaMapper.mapNutrients(food.foodNutrients),
    };
  }

  // ── Mapeo de Nutrientes ──────────────────────────────────────────────────────

  private static mapNutrients(rawNutrients: UsdaApiFoodNutrient[]): UsdaNutrient[] {
    return rawNutrients
      .filter(UsdaMapper.hasValidValue)
      .map((n) => ({
        nutrientId: n.nutrientId,
        nutrientName: n.nutrientName,
        unitName: n.unitName,
        value: n.value!, // Guardado por el filtro hasValidValue
        isMacronutrient: MACRO_NUTRIENT_IDS.has(n.nutrientId),
      }));
  }

  private static hasValidValue(n: UsdaApiFoodNutrient): boolean {
    return n.value !== undefined && n.value !== null && n.value >= 0;
  }

  // ── Limpieza del Nombre ───────────────────────────────────────────────────────

  /**
   * La USDA a veces entrega nombres en MAYÚSCULAS o con comas dobles.
   * Ej: "APPLE, RAW, WITH SKIN" → "Apple, raw, with skin"
   */
  private static cleanDescription(description: string): string {
    if (!description) return '';
    // Si está todo en mayúsculas, convertir a Title Case
    if (description === description.toUpperCase()) {
      return description
        .toLowerCase()
        .replace(/(?:^|,\s*)(\w)/g, (_, c: string) => ` ${c.toUpperCase()}`)
        .trim()
        .replace(/\s+/g, ' ');
    }
    return description.trim();
  }
}
