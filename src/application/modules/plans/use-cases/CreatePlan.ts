/**
 * CASO DE USO — CreatePlan
 *
 * Crea un NutritionPlan vacío (sin meals todavía).
 * Las meals se añaden después con el Use Case `AddMealToPlan`.
 *
 * ENTRADA:
 *   - name        (obligatorio): Nombre descriptivo del plan.
 *   - description (opcional):    Notas adicionales.
 *   - targets     (opcional):    Metas de macros del día (kcal, P, C, G).
 *
 * SALIDA:
 *   NutritionPlanEntity con id generado, meals: [] y timestamps.
 *
 * ERRORES:
 *   Ninguno de dominio específico (la validación de entrada es vía Zod).
 *   Si el repositorio falla, se propaga el error de BD sin envolver.
 */

import { z } from 'zod';
import type { NutritionPlanEntity } from '../../../../domain/modules/plans/entities/plan.entities';
import type { INutritionPlanRepository } from '../../../../domain/modules/plans/repositories/plan.repositories';

// ── Schema de Validación ───────────────────────────────────────────────────────

export const CreatePlanSchema = z.object({
  /** Nombre del plan. Ej: "Día 1 - Definición", "Plan Semana 2". */
  name: z
    .string()
    .min(1, 'El nombre del plan no puede estar vacío')
    .max(120, 'El nombre no puede superar los 120 caracteres')
    .trim(),

  /** Descripción o notas adicionales del plan. */
  description: z
    .string()
    .max(500, 'La descripción no puede superar los 500 caracteres')
    .trim()
    .optional(),

  /**
   * Metas de macros del día. Todas son opcionales.
   * El dietista puede definir solo kcal, solo proteína, o cualquier combinación.
   */
  targets: z
    .object({
      kcal: z
        .number()
        .positive('Las kcal objetivo deben ser un valor positivo')
        .optional(),
      proteins: z
        .number()
        .positive('Las proteínas objetivo deben ser un valor positivo')
        .optional(),
      carbs: z
        .number()
        .positive('Los carbohidratos objetivo deben ser un valor positivo')
        .optional(),
      fats: z
        .number()
        .positive('Las grasas objetivo deben ser un valor positivo')
        .optional(),
    })
    .optional(),
});

export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;

// ── Use Case ──────────────────────────────────────────────────────────────────

export class CreatePlanUseCase {
  constructor(
    private readonly planRepository: INutritionPlanRepository,
  ) {}

  async execute(rawInput: CreatePlanInput): Promise<NutritionPlanEntity> {
    // ── 1. Validar entrada ──────────────────────────────────────────────────
    const input = CreatePlanSchema.parse(rawInput);

    // ── 2. Crear el plan vacío vía el repositorio ───────────────────────────
    const plan = await this.planRepository.create({
      name: input.name,
      description: input.description ?? null,
      targets: input.targets ?? null,
    });

    // ── 3. Retornar la entidad de dominio creada ────────────────────────────
    return plan;
  }
}
