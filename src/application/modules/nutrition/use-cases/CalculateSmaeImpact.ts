/**
 * CASO DE USO — CalculateSmaeImpact (Motor SMAE Directo)
 *
 * Opera cuando el dietista o usuario trabaja con equivalentes teóricos
 * de la 4ta Edición del SMAE sin necesitar un ingrediente específico.
 *
 * Caso de uso clínico típico:
 *   Dietista prescribe: "2 equivalentes de Fruta"
 *   Sistema responde:   carbs=30g, prots=0g, grasas=0g, kcal=120
 *
 * Diferencia con CalculateMetabolicImpact:
 *   - CalculateMetabolicImpact: requiere un ingrediente concreto (USDA FDC).
 *   - CalculateSmaeImpact: opera con los promedios teóricos del grupo SMAE.
 *
 * Entrada aceptada (dos modos):
 *   Modo A — Por shortCode (código corto: "FRUTA", "VEG")
 *   Modo B — Por ID de categoría (UUID de la tabla smae_categories)
 *
 * Fórmula:
 *   macroTotal = avgMacroPer1Equivalent × equivalents
 */

import { z } from 'zod';
import type { SmaeCategoryImpact } from '../../../../domain/modules/nutrition/entities/nutrition.entities';
import type { ISmaeRepository } from '../../../../domain/modules/nutrition/repositories/nutrition.repositories';
import { SmaeNotFoundError, InvalidGramsError } from '../../../../domain/errors/domain.errors';
import { calculateSmaeNutrient } from '../../../../shared/utils/nutrition.utils';

// ── Schema de Validación (Zod) ────────────────────────────────────────────────

export const CalculateSmaeImpactSchema = z
  .object({
    /** Modo A: código corto de la categoría (ej: "FRUTA", "VEG", "LECHE-D") */
    shortCode: z
      .string()
      .min(1)
      .max(20)
      .toUpperCase()
      .optional(),
    /** Modo B: UUID interno de la categoría SMAE */
    categoryId: z
      .string()
      .uuid('El categoryId debe ser un UUID válido')
      .optional(),
    /** Número de equivalentes SMAE a calcular (puede ser decimal, ej: 1.5) */
    equivalents: z
      .number()
      .positive('Los equivalentes deben ser mayor a 0')
      .max(50, 'El máximo es 50 equivalentes por cálculo'),
  })
  .refine(
    (data) => data.shortCode !== undefined || data.categoryId !== undefined,
    { message: 'Debes proporcionar shortCode o categoryId de la categoría SMAE' },
  );

export type CalculateSmaeImpactInput = z.infer<typeof CalculateSmaeImpactSchema>;

// ── Use Case ──────────────────────────────────────────────────────────────────

export class CalculateSmaeImpactUseCase {
  constructor(
    private readonly smaeRepository: ISmaeRepository,
  ) {}

  async execute(rawInput: CalculateSmaeImpactInput): Promise<SmaeCategoryImpact> {
    // ── Validación de entrada ──────────────────────────────────────────────────
    const input = CalculateSmaeImpactSchema.parse(rawInput);
    const { shortCode, categoryId, equivalents } = input;

    if (equivalents <= 0) {
      throw new InvalidGramsError(equivalents);
    }

    // ── 1. Resolver la categoría SMAE (Modo A o Modo B) ───────────────────────
    let category = null;

    if (shortCode) {
      category = await this.smaeRepository.findByShortCode(shortCode);
      if (!category) throw new SmaeNotFoundError(shortCode);
    } else if (categoryId) {
      category = await this.smaeRepository.findById(categoryId);
      if (!category) throw new SmaeNotFoundError(categoryId);
    }

    if (!category) throw new SmaeNotFoundError('desconocido');

    // ── 2. Calcular macros usando promedios teóricos SMAE (4ta Edición) ───────
    //    Fórmula: macroTotal = avgMacroPer1Equivalent × equivalents
    const macros = {
      carbs: calculateSmaeNutrient(category.avgCarbs, equivalents),
      proteins: calculateSmaeNutrient(category.avgProteins, equivalents),
      fats: calculateSmaeNutrient(category.avgFats, equivalents),
      kcal: calculateSmaeNutrient(category.avgKcal, equivalents),
    };

    // ── 3. Retornar resultado del Motor SMAE ───────────────────────────────────
    return {
      categoryId: category.id,
      categoryName: category.name,
      shortCode: category.shortCode,
      equivalents,
      // No tenemos un peso de referencia universal por categoría (varía
      // por ingrediente). Se marca null hasta que se conecte un ingrediente.
      referenceGrams: null,
      macros,
    };
  }
}
