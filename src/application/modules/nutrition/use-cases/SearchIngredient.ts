/**
 * CASO DE USO — SearchIngredient (v2 — Fase 3: USDA integrado)
 *
 * Buscador unificado con tres fuentes de datos ejecutadas en paralelo:
 *   1. Ingredientes en la base de datos local     → source: 'ingredient'
 *   2. Categorías SMAE (4ta Edición)              → source: 'smae_local'
 *   3. API USDA FoodData Central (externa)        → source: 'usda'
 *
 * Estrategia de resiliencia:
 *   Usa `Promise.allSettled` en lugar de `Promise.all`. Si la USDA
 *   hace timeout o falla, los resultados locales siempre se entregan.
 *   El gateway mismo retorna [] ante cualquier error — doble protección.
 *
 * Orden de resultados (prioridad decreciente):
 *   [ingredientes locales] → [categorías SMAE] → [resultados USDA]
 *
 * Reglas:
 *   - Query mínimo: 2 caracteres.
 *   - Límite local: 10 ingredientes + 5 categorías SMAE.
 *   - Límite USDA: configurable, default 10.
 *   - Si IUsdaGateway no está inyectado (null), la búsqueda USDA se saltea.
 */

import { z } from 'zod';
import type { SearchResult } from '../../../../domain/modules/nutrition/entities/nutrition.entities';
import type {
  IIngredientRepository,
  ISmaeRepository,
  IUsdaGateway,
  UsdaSearchResult,
} from '../../../../domain/modules/nutrition/repositories/nutrition.repositories';
import type { IngredientSummary, SmaeCategoryEntity } from '../../../../domain/modules/nutrition/entities/nutrition.entities';

// ── Schema de Validación (Zod) ────────────────────────────────────────────────

export const SearchIngredientSchema = z.object({
  query: z
    .string()
    .min(2, 'La búsqueda debe tener al menos 2 caracteres')
    .max(100, 'La búsqueda no puede superar los 100 caracteres')
    .trim(),
  limit: z.number().int().min(1).max(50).default(10).optional(),
  /** Si false, excluye categorías SMAE de los resultados (default: true) */
  includeSmaeCategories: z.boolean().default(true).optional(),
  /** Si false, excluye la búsqueda en USDA FDC (default: true) */
  includeUsda: z.boolean().default(true).optional(),
  /** Número de resultados a pedir a USDA (default: 10) */
  usdaLimit: z.number().int().min(1).max(25).default(10).optional(),
});

export type SearchIngredientInput = z.infer<typeof SearchIngredientSchema>;

// ── Use Case ──────────────────────────────────────────────────────────────────

export class SearchIngredientUseCase {
  constructor(
    private readonly ingredientRepository: IIngredientRepository,
    private readonly smaeRepository: ISmaeRepository,
    /** Null cuando la integración USDA no está configurada (entornos de test) */
    private readonly usdaGateway: IUsdaGateway | null = null,
  ) {}

  async execute(rawInput: SearchIngredientInput): Promise<SearchResult[]> {
    // ── Validación de entrada ──────────────────────────────────────────────────
    const input = SearchIngredientSchema.parse(rawInput);
    const {
      query,
      limit = 10,
      includeSmaeCategories = true,
      includeUsda = true,
      usdaLimit = 10,
    } = input;

    // ── Determine las promesas a ejecutar ─────────────────────────────────────
    const localIngredientSearch = this.ingredientRepository.search(query, limit);

    const smaeSearch = includeSmaeCategories
      ? this.smaeRepository.searchByName(query, 5)
      : Promise.resolve([] as SmaeCategoryEntity[]);

    const usdaSearch =
      includeUsda && this.usdaGateway !== null
        ? this.usdaGateway.search(query, usdaLimit)
        : Promise.resolve([] as UsdaSearchResult[]);

    // ── Promise.allSettled: un fallo de USDA no cancela el resto ─────────────
    const [ingredientsResult, smaeResult, usdaResult] = await Promise.allSettled([
      localIngredientSearch,
      smaeSearch,
      usdaSearch,
    ]);

    // Extraer valores (o [] si la promesa fue rechazada)
    const ingredients = ingredientsResult.status === 'fulfilled' ? ingredientsResult.value : [];
    const smaeCategories = smaeResult.status === 'fulfilled' ? smaeResult.value : [];
    const usdaFoods = usdaResult.status === 'fulfilled' ? usdaResult.value : [];

    if (ingredientsResult.status === 'rejected') {
      console.error('[SearchIngredient] Error en búsqueda local:', ingredientsResult.reason);
    }
    if (usdaResult.status === 'rejected') {
      console.warn('[SearchIngredient] Error en búsqueda USDA:', usdaResult.reason);
    }

    // ── Mapear a SearchResult unificado ───────────────────────────────────────
    const ingredientResults: SearchResult[] = ingredients.map((ing: IngredientSummary) => ({
      source: 'ingredient' as const,
      id: ing.id,
      name: ing.name,
      fdcId: ing.fdcId,
      hasSmaeMapping: ing.hasSmaeMapping,
    }));

    const smaeResults: SearchResult[] = smaeCategories.map((cat: SmaeCategoryEntity) => ({
      source: 'smae_local' as const,
      id: cat.id,
      name: cat.name,
      shortCode: cat.shortCode,
      avgKcal: cat.avgKcal,
    }));

    const usdaResults: SearchResult[] = usdaFoods.map((food: UsdaSearchResult) => ({
      source: 'usda' as const,
      id: String(food.fdcId), // fdcId como string para unificar con el discriminador
      name: food.description,
      fdcId: food.fdcId,
      hasSmaeMapping: false, // Los resultados USDA no tienen mapeo SMAE aún
    }));

    // Orden: ingredientes locales primero, SMAE al final, USDA después de locales
    return [...ingredientResults, ...smaeResults, ...usdaResults];
  }
}
