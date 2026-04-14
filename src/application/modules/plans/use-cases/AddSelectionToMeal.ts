/**
 * CASO DE USO — AddSelectionToMeal
 *
 * Añade un elemento de alimento a una comida del plan.
 * Implementa la INVARIANTE HÍBRIDA de selección:
 *
 *   Caso A — Ingrediente exacto (USDA/CUSTOM/Verified):
 *     - Modo A.1 Gramos:   ingredientId + consumedGrams
 *     - Modo A.2 Porción:  ingredientId + portionId + portionQty
 *     - Equivalentes SMAE opcionales (se derivan automáticamente si hay SmaeMapping)
 *
 *   Caso B — Grupo SMAE teórico (sin ingrediente específico):
 *     - smaeCategoryId + smaeEquivalents
 *
 * VALIDACIÓN DE INVARIANTE:
 *   ingredientId XOR smaeCategoryId → exactamente uno debe estar presente.
 *   Esta regla se aplica aquí (capa de Aplicación / Zod), NO en SQL.
 *
 * SALIDA:
 *   MealSelectionEntity recién creada.
 *
 * ERRORES:
 *   - MealNotFoundError              : la comida destino no existe.
 *   - IngredientNotFoundError        : el ingrediente referenciado no existe.
 *   - InvalidSelectionReferenceError : ambos o ningún FK presente.
 *   - InvalidSelectionQuantityError  : cantidad incongruente con el tipo.
 */

import { z } from 'zod';
import type { MealSelectionEntity } from '../../../../domain/modules/plans/entities/plan.entities';
import type { IMealRepository, IMealSelectionRepository } from '../../../../domain/modules/plans/repositories/plan.repositories';
import type { IIngredientRepository } from '../../../../domain/modules/nutrition/repositories/nutrition.repositories';
import {
  MealNotFoundError,
  IngredientNotFoundError,
  InvalidSelectionReferenceError,
  InvalidSelectionQuantityError,
} from '../../../../domain/errors/domain.errors';

// ── Schema de Validación ───────────────────────────────────────────────────────

export const AddSelectionToMealSchema = z
  .object({
    /** UUID de la comida donde se añade la selección. */
    mealId: z.string().uuid('mealId debe ser un UUID válido'),

    // ── Referencia híbrida (mutuamente excluyentes) ──────────────────────────

    /** Caso A: ID del ingrediente exacto (USDA/CUSTOM/Verified). */
    ingredientId: z.string().uuid('ingredientId debe ser un UUID válido').optional(),

    /** Caso B: ID de la categoría SMAE teórica. */
    smaeCategoryId: z.string().uuid('smaeCategoryId debe ser un UUID válido').optional(),

    // ── Cantidad – Modo A.1 (gramos exactos) ────────────────────────────────
    consumedGrams: z
      .number()
      .positive('consumedGrams debe ser mayor a 0')
      .optional(),

    // ── Cantidad – Modo A.2 (porción estandarizada) ─────────────────────────
    /** UUID de la IngredientPortion (ej: el registro "1 taza" de avena). */
    portionId: z.string().uuid('portionId debe ser un UUID válido').optional(),

    /** Número de porciones (puede ser decimal, ej: 1.5 para "1.5 tazas"). */
    portionQty: z
      .number()
      .positive('portionQty debe ser mayor a 0')
      .optional(),

    // ── Cantidad – Caso B (equivalentes SMAE) ───────────────────────────────
    smaeEquivalents: z
      .number()
      .positive('smaeEquivalents debe ser mayor a 0')
      .max(50, 'El máximo son 50 equivalentes por selección')
      .optional(),

    // ── Metadatos ────────────────────────────────────────────────────────────
    /** Indicaciones de preparación. Ej: "Sin piel", "Al vapor". */
    notes: z.string().max(200).trim().optional(),
  })
  .superRefine((data, ctx) => {
    // ── Regla 1: XOR en la referencia ──────────────────────────────────────
    const hasBoth = !!data.ingredientId && !!data.smaeCategoryId;
    const hasNone = !data.ingredientId && !data.smaeCategoryId;

    if (hasBoth || hasNone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Debes proporcionar exactamente uno: ingredientId (Caso A) o smaeCategoryId (Caso B), no ambos ni ninguno.',
        path: ['ingredientId'],
      });
      return;
    }

    // ── Regla 2: Caso A — requiere cantidad ────────────────────────────────
    if (data.ingredientId) {
      const hasGrams = data.consumedGrams !== undefined;
      const hasPortion = data.portionId !== undefined && data.portionQty !== undefined;

      if (!hasGrams && !hasPortion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Caso A (ingrediente): debes proveer consumedGrams (gramos) o portionId + portionQty (porción).',
          path: ['consumedGrams'],
        });
      }

      // portionId sin portionQty o viceversa es inválido
      if (data.portionId && data.portionQty === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'portionQty es obligatorio cuando se usa portionId.',
          path: ['portionQty'],
        });
      }
      if (data.portionQty && !data.portionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'portionId es obligatorio cuando se usa portionQty.',
          path: ['portionId'],
        });
      }
    }

    // ── Regla 3: Caso B — requiere smaeEquivalents ─────────────────────────
    if (data.smaeCategoryId && data.smaeEquivalents === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Caso B (SMAE): smaeEquivalents es obligatorio cuando se usa smaeCategoryId.',
        path: ['smaeEquivalents'],
      });
    }
  });

export type AddSelectionToMealInput = z.infer<typeof AddSelectionToMealSchema>;

// ── Use Case ──────────────────────────────────────────────────────────────────

export class AddSelectionToMealUseCase {
  constructor(
    private readonly mealRepository: IMealRepository,
    private readonly selectionRepository: IMealSelectionRepository,
    private readonly ingredientRepository: IIngredientRepository,
  ) {}

  async execute(rawInput: AddSelectionToMealInput): Promise<MealSelectionEntity> {
    // ── 1. Validar entrada (Zod cubre la invariante híbrida) ───────────────
    const input = AddSelectionToMealSchema.parse(rawInput);

    // ── 2. Verificar que la comida existe ──────────────────────────────────
    const meal = await this.mealRepository.findByIdWithSelections(input.mealId);
    if (!meal) {
      throw new MealNotFoundError(input.mealId);
    }

    // ── 3. Caso A: resolver ingrediente y gramos ───────────────────────────
    let resolvedGrams: number | undefined;

    if (input.ingredientId) {
      // Verificar existencia del ingrediente
      const ingredient = await this.ingredientRepository.findByIdWithRelations(
        input.ingredientId,
      );
      if (!ingredient) {
        throw new IngredientNotFoundError(input.ingredientId);
      }

      // Modo A.1: gramos directos — ya validados por Zod
      if (input.consumedGrams !== undefined) {
        resolvedGrams = input.consumedGrams;
      }

      // Modo A.2: porción → resolver gramaje desde el catálogo del ingrediente
      if (input.portionId !== undefined && input.portionQty !== undefined) {
        const portion = ingredient.portions.find((p) => p.id === input.portionId);
        if (!portion) {
          throw new InvalidSelectionQuantityError(
            `La porción "${input.portionId}" no pertenece al ingrediente "${ingredient.name}".`,
          );
        }
        // FÓRMULA: gramos = gramWeight_de_la_porción × cantidad_de_porciones
        resolvedGrams = portion.gramWeight * input.portionQty;
      }

      // Guardia de seguridad (la invariante ya fue validada por Zod, pero por defensa)
      if (resolvedGrams === undefined) {
        throw new InvalidSelectionQuantityError(
          'No se pudo resolver la cantidad en gramos para el ingrediente seleccionado.',
        );
      }
    }

    // ── 4. Guardia de referencia (doble seguro más allá de Zod) ────────────
    if (
      (!!input.ingredientId && !!input.smaeCategoryId) ||
      (!input.ingredientId && !input.smaeCategoryId)
    ) {
      throw new InvalidSelectionReferenceError();
    }

    // ── 5. Persistir la selección ─────────────────────────────────────────
    const type = input.ingredientId ? 'ingredient' : 'smae';
    const quantityMode =
      type === 'ingredient'
        ? input.portionId
          ? 'portion'
          : 'grams'
        : undefined;

    const selection = await this.selectionRepository.create({
      mealId: input.mealId,
      type,
      ingredientId: input.ingredientId,
      smaeCategoryId: input.smaeCategoryId,
      quantityMode,
      consumedGrams: resolvedGrams,
      portionId: input.portionId,
      portionQty: input.portionQty,
      smaeEquivalents: input.smaeEquivalents,
      notes: input.notes,
    });

    return selection;
  }
}
