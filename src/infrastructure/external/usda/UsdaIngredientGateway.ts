/**
 * INFRAESTRUCTURA — UsdaIngredientGateway
 * Implementa el puerto IUsdaGateway usando la API de USDA FoodData Central.
 *
 * Estrategias de resiliencia:
 *   1. TIMEOUT (3s): AbortController + setTimeout. Si la USDA no responde
 *      en 3s, se aborta la request y se retorna [] silenciosamente.
 *   2. DEGRADACIÓN SILENCIOSA: Cualquier error (red, 4xx, 5xx, JSON inválido)
 *      retorna [] en lugar de propagar una excepción. Esto garantiza que
 *      los resultados locales siempre lleguen al cliente.
 *   3. LOG: Los errores se loguean en consola para diagnóstico en producción.
 *
 * Endpoint USDA:
 *   GET https://api.nal.usda.gov/fdc/v1/foods/search
 *   Params: query, pageSize, api_key, dataType (filtro de calidad)
 */

import type { IUsdaGateway, UsdaSearchResult } from '../../../domain/modules/nutrition/repositories/nutrition.repositories';
import type { UsdaApiSearchResponse } from './usda.types';
import { UsdaMapper } from './UsdaMapper';

// ── Tipos de datos preferidos (mayor calidad nutricional) ─────────────────────
// Foundation: datos analíticos de alta precisión
// SR Legacy:  referencia histórica estándar del USDA
// Survey:     datos del National Nutrient Database
// Excluimos 'Branded' por defecto (datos de fabricante, menos confiables)
const PREFERRED_DATA_TYPES = ['Foundation', 'SR Legacy', 'Survey (FNDDS)'];

export class UsdaIngredientGateway implements IUsdaGateway {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(options: {
    baseUrl: string;
    apiKey: string;
    /** Milisegundos antes de abortar la request. Default: 3000ms */
    timeoutMs?: number;
  }) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 3000;
  }

  async search(query: string, limit = 10): Promise<UsdaSearchResult[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = this._buildUrl(query, limit);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Atleet-Nutrition-Engine/1.0',
        },
      });

      if (!response.ok) {
        console.warn(`[UsdaGateway] API respondió con ${response.status} para query: "${query}"`);
        return [];
      }

      const data = (await response.json()) as UsdaApiSearchResponse;

      if (!data.foods || !Array.isArray(data.foods)) {
        console.warn('[UsdaGateway] Respuesta inesperada: falta el campo foods');
        return [];
      }

      return UsdaMapper.mapFoods(data.foods);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn(`[UsdaGateway] Timeout después de ${this.timeoutMs}ms para query: "${query}"`);
        } else {
          console.error('[UsdaGateway] Error de red:', error.message);
        }
      }
      // Degradación silenciosa: devolvemos [] para no interrumpir los resultados locales
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ── Construcción de URL ─────────────────────────────────────────────────────

  private _buildUrl(query: string, pageSize: number): string {
    const params = new URLSearchParams({
      query,
      pageSize: String(pageSize),
      api_key: this.apiKey,
      // Priorizar datos de alta calidad
      dataType: PREFERRED_DATA_TYPES.join(','),
    });
    return `${this.baseUrl}/foods/search?${params.toString()}`;
  }
}
