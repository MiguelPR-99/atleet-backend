/**
 * CASO DE USO — CalculateMetabolicImpact (Motor USDA)
 * El corazón del Motor Metabólico de Atleet ("Precisión Inteligente").
 *
 * ENTRADA PRIMARIA — Por ID de ingrediente + gramos:
 *   Accede al perfil FDC completo del ingrediente y calcula cada
 *   micro y macro nutriente con la fórmula universal USDA FDC.
 *
 * ENTRADA SECUNDARIA — Por gramos directos con shortCode SMAE:
 *   Convierte equivalentes SMAE → gramos antes de pasar al motor.
 *   Útil cuando el dietista conoce el equivalente pero quiere
 *   calcular sobre un ingrediente específico.
 *
 * Fórmula Universal USDA FDC:
 *   impactoNutriente = (amountPer100g / 100) × consumedGrams
 *
 * Fórmula de Equivalentes SMAE (si tiene mapeo):
 *   equivalentesSmae = consumedGrams / equivalentWeight
 *
 * Depende SOLO de IIngredientRepository (contrato), NUNCA de Prisma directamente.
 */

import { z } from 'zod';
import type { MetabolicResult } from '../../../../domain/modules/nutrition/entities/nutrition.entities';
import type { IIngredientRepository } from '../../../../domain/modules/nutrition/repositories/nutrition.repositories';
import {
  IngredientNotFoundError,
  InvalidGramsError,
} from '../../../../domain/errors/domain.errors';
import {
  calculateNutrientAmount,
  gramsToEquivalents,
  equivalentsToGrams,
} from '../../../../shared/utils/nutrition.utils';

// ── Schema de Validación (Zod) ────────────────────────────────────────────────

export const CalculateMetabolicImpactSchema = z.object({
  ingredientId: z.string().uuid('El ID del ingrediente debe ser un UUID válido'),
  /**
   * Modo 1: Gramos directos.
   * Modo 2 (con smaeEquivalents): se ignorará este valor; los gramos
   * se derivarán del mapeo SMAE del propio ingrediente.
   */
  consumedGrams: z
    .number()
    .positive('Los gramos deben ser un número positivo')
    .optional(),
  /**
   * Modo alternativo: el usuario enviará equivalentes SMAE en lugar de gramos.
   * Requiere que el ingrediente tenga un mapeo SMAE configurado.
   */
  smaeEquivalents: z
    .number()
    .positive('Los equivalentes SMAE deben ser un número positivo')
    .optional(),
}).refine(
  (data) => data.consumedGrams !== undefined || data.smaeEquivalents !== undefined,
  { message: 'Debes proporcionar consumedGrams o smaeEquivalents' },
);

export type CalculateMetabolicImpactInput = z.infer<typeof CalculateMetabolicImpactSchema>;

// ── Use Case ──────────────────────────────────────────────────────────────────

export class CalculateMetabolicImpactUseCase {
  constructor(
    private readonly ingredientRepository: IIngredientRepository,
  ) {}

  async execute(rawInput: CalculateMetabolicImpactInput): Promise<MetabolicResult> {
    // ── Validación de entrada ──────────────────────────────────────────────────
    const input = CalculateMetabolicImpactSchema.parse(rawInput);
    const { ingredientId, consumedGrams: rawGrams, smaeEquivalents } = input;

    // ── 1. Obtener ingrediente con perfil USDA y regla SMAE ───────────────────
    const ingredient = await this.ingredientRepository.findByIdWithRelations(ingredientId);
    if (!ingredient) {
      throw new IngredientNotFoundError(ingredientId);
    }

    // ── 2. Resolver los gramos finales ────────────────────────────────────────
    let consumedGrams: number;

    if (smaeEquivalents !== undefined) {
      // Modo 2: Equivalentes → Gramos (requiere mapeo SMAE en el ingrediente)
      if (!ingredient.smaeMapping) {
        throw new InvalidGramsError(0); // El ingrediente no soporta equivalentes
      }
      consumedGrams = equivalentsToGrams(
        smaeEquivalents,
        ingredient.smaeMapping.equivalentWeight,
      );
    } else {
      // Modo 1: Gramos directos
      consumedGrams = rawGrams!;
      if (consumedGrams <= 0) {
        throw new InvalidGramsError(consumedGrams);
      }
    }

    // ── 3. Calcular impacto de nutrientes (Fórmula Universal USDA FDC) ────────
    const nutrients = ingredient.nutrients.map((ingNut: import('../../../../domain/modules/nutrition/entities/nutrition.entities').IngredientNutrientEntity) => ({
      nutrientId: ingNut.nutrientId,
      nutrientName: ingNut.nutrientName,
      unit: ingNut.unitName,
      calculatedAmount: calculateNutrientAmount(
        ingNut.amountPer100g,
        consumedGrams,
        ingNut.isMacronutrient,
      ),
      isMacronutrient: ingNut.isMacronutrient,
    }));

    // ── 4. Calcular Equivalentes SMAE (derivado) ──────────────────────────────
    let smaeEquivalentsResult: number | null = null;
    let smaeCategoryResult: string | null = null;

    if (ingredient.smaeMapping) {
      smaeEquivalentsResult = gramsToEquivalents(
        consumedGrams,
        ingredient.smaeMapping.equivalentWeight,
      );
      smaeCategoryResult = ingredient.smaeMapping.shortCode;
    }

    // ── 5. Extraer resumen de macros para acceso rápido sin filtrar el array ──
    const macroMap = new Map(
      nutrients
        .filter((n: { isMacronutrient: boolean }) => n.isMacronutrient)
        .map((n: { nutrientName: string; calculatedAmount: number }) => [n.nutrientName.toLowerCase(), n.calculatedAmount]),
    );

    const macros = {
      carbs: macroMap.get('carbohydrate, by difference') ?? macroMap.get('carbohidratos') ?? 0,
      proteins: macroMap.get('protein') ?? macroMap.get('proteínas') ?? 0,
      fats: macroMap.get('total lipid (fat)') ?? macroMap.get('grasas') ?? 0,
      kcal: macroMap.get('energy') ?? macroMap.get('energía') ?? 0,
    };

    // ── 6. Retornar snapshot metabólico ───────────────────────────────────────
    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      consumedGrams,
      smaeEquivalents: smaeEquivalentsResult,
      smaeCategory: smaeCategoryResult,
      macros,
      nutrients,
    };
  }
}

// ── Función auxiliar exportada ────────────────────────────────────────────────
// Convierte equivalentes SMAE a gramos para pre-procesar antes de llamar
// al use case (alternativa funcional a usar el campo smaeEquivalents).

export { equivalentsToGrams as resolveGramsFromEquivalents } from '../../../../shared/utils/nutrition.utils';
