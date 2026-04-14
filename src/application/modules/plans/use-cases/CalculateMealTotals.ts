/**
 * CASO DE USO — CalculateMealTotals
 *
 * Orquestador del Motor Metabólico para una Meal completa.
 *
 * LÓGICA POR SELECCIÓN:
 *
 *   Caso A (selection.type === 'ingredient'):
 *     → Delega a CalculateMetabolicImpactUseCase con consumedGrams ya resueltos.
 *     → Resultado: macros USDA de precisión (perfil FDC completo).
 *
 *   Caso B (selection.type === 'smae'):
 *     → Delega a CalculateSmaeImpactUseCase con smaeEquivalents.
 *     → Resultado: macros teóricos del grupo SMAE (4ta Edición).
 *
 * SUMA DE TOTALES:
 *   Se acumulan kcal, proteínas, carbohidratos y grasas de todas las selecciones.
 *   Las selecciones con error no detendrán el cálculo del resto (modo tolerante).
 *   Se incluye un array `errors` para reportar fallos individuales al cliente.
 *
 * ENTRADA:
 *   - mealId (UUID, obligatorio)
 *
 * SALIDA:
 *   MealTotalsResult con el breakdown por selección + totales acumulados.
 *
 * ERRORES DE FLUJO:
 *   - MealNotFoundError: la comida no existe.
 */

import { z } from 'zod';
import type { MacroSummary } from '../../../../domain/modules/plans/entities/plan.entities';
import type { IMealRepository } from '../../../../domain/modules/plans/repositories/plan.repositories';
import type { MetabolicResult, SmaeCategoryImpact } from '../../../../domain/modules/nutrition/entities/nutrition.entities';
import { MealNotFoundError } from '../../../../domain/errors/domain.errors';
import { CalculateMetabolicImpactUseCase } from '../../nutrition/use-cases/CalculateMetabolicImpact';
import { CalculateSmaeImpactUseCase } from '../../nutrition/use-cases/CalculateSmaeImpact';

// ── Tipos de Salida ───────────────────────────────────────────────────────────

/** Resultado de calcular una selección individual */
export type SelectionCalculationResult =
  | {
      selectionId: string;
      type: 'ingredient';
      status: 'ok';
      ingredientId: string;
      consumedGrams: number;
      macros: MacroSummary;
      detail: MetabolicResult;
    }
  | {
      selectionId: string;
      type: 'smae';
      status: 'ok';
      smaeCategoryId: string;
      smaeEquivalents: number;
      macros: MacroSummary;
      detail: SmaeCategoryImpact;
    }
  | {
      selectionId: string;
      status: 'error';
      reason: string;
    };

/** Resultado completo del cálculo de una Meal */
export interface MealTotalsResult {
  mealId: string;
  mealName: string;
  /** Desglose por selección individual */
  selections: SelectionCalculationResult[];
  /** Macros totales acumulados (solo selecciones con status 'ok') */
  totals: MacroSummary;
  /** Cantidad de selecciones que fallaron el cálculo */
  errorCount: number;
}

// ── Schema de Entrada ─────────────────────────────────────────────────────────

export const CalculateMealTotalsSchema = z.object({
  mealId: z.string().uuid('mealId debe ser un UUID válido'),
});

export type CalculateMealTotalsInput = z.infer<typeof CalculateMealTotalsSchema>;

// ── Use Case ──────────────────────────────────────────────────────────────────

export class CalculateMealTotalsUseCase {
  constructor(
    private readonly mealRepository: IMealRepository,
    private readonly calculateMetabolicImpact: CalculateMetabolicImpactUseCase,
    private readonly calculateSmaeImpact: CalculateSmaeImpactUseCase,
  ) {}

  async execute(rawInput: CalculateMealTotalsInput): Promise<MealTotalsResult> {
    // ── 1. Validar entrada ──────────────────────────────────────────────────
    const { mealId } = CalculateMealTotalsSchema.parse(rawInput);

    // ── 2. Cargar la comida con sus selecciones ─────────────────────────────
    const meal = await this.mealRepository.findByIdWithSelections(mealId);
    if (!meal) {
      throw new MealNotFoundError(mealId);
    }

    // ── 3. Acumuladores ────────────────────────────────────────────────────
    const results: SelectionCalculationResult[] = [];
    const totals: MacroSummary = { kcal: 0, proteins: 0, carbs: 0, fats: 0 };

    // ── 4. Calcular cada selección (modo tolerante a errores individuales) ──
    for (const selection of meal.selections) {
      try {
        if (selection.type === 'ingredient') {
          // ── Caso A: Motor USDA ──────────────────────────────────────────
          if (!selection.ingredientId || selection.consumedGrams === undefined) {
            results.push({
              selectionId: selection.id,
              status: 'error',
              reason:
                'Selección de ingrediente sin ingredientId o consumedGrams resuelto.',
            });
            continue;
          }

          const metabolicResult = await this.calculateMetabolicImpact.execute({
            ingredientId: selection.ingredientId,
            consumedGrams: selection.consumedGrams,
          });

          const macros: MacroSummary = {
            kcal: metabolicResult.macros.kcal,
            proteins: metabolicResult.macros.proteins,
            carbs: metabolicResult.macros.carbs,
            fats: metabolicResult.macros.fats,
          };

          // Acumular en totales
          totals.kcal += macros.kcal;
          totals.proteins += macros.proteins;
          totals.carbs += macros.carbs;
          totals.fats += macros.fats;

          results.push({
            selectionId: selection.id,
            type: 'ingredient',
            status: 'ok',
            ingredientId: selection.ingredientId,
            consumedGrams: selection.consumedGrams,
            macros,
            detail: metabolicResult,
          });
        } else {
          // ── Caso B: Motor SMAE ──────────────────────────────────────────
          if (!selection.smaeCategoryId || selection.smaeEquivalents === undefined) {
            results.push({
              selectionId: selection.id,
              status: 'error',
              reason:
                'Selección SMAE sin smaeCategoryId o smaeEquivalents.',
            });
            continue;
          }

          const smaeResult = await this.calculateSmaeImpact.execute({
            categoryId: selection.smaeCategoryId,
            equivalents: selection.smaeEquivalents,
          });

          const macros: MacroSummary = {
            kcal: smaeResult.macros.kcal,
            proteins: smaeResult.macros.proteins,
            carbs: smaeResult.macros.carbs,
            fats: smaeResult.macros.fats,
          };

          // Acumular en totales
          totals.kcal += macros.kcal;
          totals.proteins += macros.proteins;
          totals.carbs += macros.carbs;
          totals.fats += macros.fats;

          results.push({
            selectionId: selection.id,
            type: 'smae',
            status: 'ok',
            smaeCategoryId: selection.smaeCategoryId,
            smaeEquivalents: selection.smaeEquivalents,
            macros,
            detail: smaeResult,
          });
        }
      } catch (err: unknown) {
        // Error en una selección individual no bloquea el resto del cálculo
        const reason =
          err instanceof Error ? err.message : 'Error desconocido en el cálculo.';
        results.push({ selectionId: selection.id, status: 'error', reason });
      }
    }

    // ── 5. Redondear totales a 2 decimales ─────────────────────────────────
    totals.kcal = Math.round(totals.kcal * 100) / 100;
    totals.proteins = Math.round(totals.proteins * 100) / 100;
    totals.carbs = Math.round(totals.carbs * 100) / 100;
    totals.fats = Math.round(totals.fats * 100) / 100;

    const errorCount = results.filter((r) => r.status === 'error').length;

    return {
      mealId: meal.id,
      mealName: meal.name,
      selections: results,
      totals,
      errorCount,
    };
  }
}
