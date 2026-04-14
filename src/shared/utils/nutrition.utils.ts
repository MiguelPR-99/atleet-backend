/**
 * SHARED — Utilidades de Cálculo Nutricional
 * Funciones puras sin efectos secundarios ni dependencias externas.
 * Centralizadas aquí para evitar que la lógica de redondeo se duplique
 * en cada use case y sea fácil de probar con unit tests.
 */

// ── Constantes ────────────────────────────────────────────────────────────────

/** Precisión de display para macronutrientes (carbohidratos, proteínas, grasas) */
const MACRO_DECIMALS = 2;

/** Precisión de display para micronutrientes (vitaminas, minerales) */
const MICRO_DECIMALS = 3;

/** Precisión interna para equivalentes SMAE (evita floating point errors) */
const SMAE_DECIMALS = 4;

// ── Redondeo ──────────────────────────────────────────────────────────────────

/**
 * Redondea un valor nutricional para presentación en UI.
 * Usa `parseFloat(toFixed())` para eliminar ceros no significativos
 * (ej: 1.200 → 1.2, no "1.200").
 */
export function roundNutrient(value: number, decimals = MACRO_DECIMALS): number {
  return parseFloat(value.toFixed(decimals));
}

export function roundMacro(value: number): number {
  return roundNutrient(value, MACRO_DECIMALS);
}

export function roundMicro(value: number): number {
  return roundNutrient(value, MICRO_DECIMALS);
}

// ── Fórmula Universal USDA FDC ────────────────────────────────────────────────

/**
 * Calcula el impacto de un nutriente para una cantidad en gramos.
 * Fórmula: (amountPer100g / 100) * consumedGrams
 *
 * @param amountPer100g - Valor del nutriente por 100g (base de datos FDC)
 * @param consumedGrams - Gramos consumidos por el usuario
 * @param isMacro - Si true usa 2 decimales, si false usa 3 (micro)
 */
export function calculateNutrientAmount(
  amountPer100g: number,
  consumedGrams: number,
  isMacro = true,
): number {
  const raw = (amountPer100g / 100) * consumedGrams;
  return isMacro ? roundMacro(raw) : roundMicro(raw);
}

// ── Conversión Equivalentes ↔ Gramos ─────────────────────────────────────────

/**
 * Convierte gramos a equivalentes SMAE.
 * Fórmula: consumedGrams / equivalentWeight
 *
 * @param consumedGrams - Gramos consumidos
 * @param equivalentWeight - Peso (g) de 1 equivalente de la categoría SMAE
 */
export function gramsToEquivalents(
  consumedGrams: number,
  equivalentWeight: number,
): number {
  if (equivalentWeight <= 0) throw new Error('El peso del equivalente debe ser mayor a 0');
  return parseFloat((consumedGrams / equivalentWeight).toFixed(SMAE_DECIMALS));
}

/**
 * Convierte equivalentes SMAE a gramos.
 * Fórmula: equivalents * equivalentWeight
 *
 * @param equivalents - Número de equivalentes SMAE
 * @param equivalentWeight - Peso (g) de 1 equivalente de la categoría SMAE
 */
export function equivalentsToGrams(
  equivalents: number,
  equivalentWeight: number,
): number {
  if (equivalents <= 0) throw new Error('Los equivalentes deben ser mayor a 0');
  return parseFloat((equivalents * equivalentWeight).toFixed(SMAE_DECIMALS));
}

// ── Cálculo de Macros SMAE ────────────────────────────────────────────────────

/**
 * Calcula los macros totales para N equivalentes de una categoría SMAE.
 * Usa los promedios teóricos de la 4ta edición.
 *
 * @param avgPer1Equivalent - Valor promedio por 1 equivalente (avgCarbs, avgProteins, etc.)
 * @param equivalents - Número de equivalentes consumidos
 */
export function calculateSmaeNutrient(
  avgPer1Equivalent: number,
  equivalents: number,
): number {
  return roundMacro(avgPer1Equivalent * equivalents);
}
