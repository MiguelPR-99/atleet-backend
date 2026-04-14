/**
 * CASO DE USO — AddMealToPlan
 *
 * Añade una nueva comida (Meal) a un NutritionPlan existente.
 *
 * Responsabilidades:
 *   1. Validar la entrada con Zod.
 *   2. Verificar que el plan destino existe.
 *   3. Si no se provee `order`, se asigna automáticamente al final de las comidas del plan.
 *   4. Persistir la Meal vía IMealRepository.
 *
 * ENTRADA:
 *   - nutritionPlanId (UUID, obligatorio)
 *   - name            (string, obligatorio)  ej: "Desayuno", "Cena"
 *   - order           (int, opcional)        posición en el día; auto si se omite
 *   - time            (HH:MM, opcional)      hora sugerida de la comida
 *
 * SALIDA:
 *   MealEntity recién creada (sin selecciones todavía).
 *
 * ERRORES:
 *   - PlanNotFoundError: el plan destino no existe.
 */

import { z } from 'zod';
import type { MealEntity } from '../../../../domain/modules/plans/entities/plan.entities';
import type {
  INutritionPlanRepository,
  IMealRepository,
} from '../../../../domain/modules/plans/repositories/plan.repositories';
import { PlanNotFoundError } from '../../../../domain/errors/domain.errors';

// ── Schema de Validación ───────────────────────────────────────────────────────

export const AddMealToPlanSchema = z.object({
  /** UUID del plan al que se añadirá la comida. */
  nutritionPlanId: z
    .string()
    .uuid('nutritionPlanId debe ser un UUID válido'),

  /** Nombre de la comida. Ej: "Desayuno", "Colación Matutina", "Cena". */
  name: z
    .string()
    .min(1, 'El nombre de la comida no puede estar vacío')
    .max(80, 'El nombre no puede superar 80 caracteres')
    .trim(),

  /**
   * Posición cronológica dentro del plan (1 = primera).
   * Si se omite, la comida se añade al final automáticamente.
   */
  order: z
    .number()
    .int('El orden debe ser un número entero')
    .positive('El orden debe ser mayor a 0')
    .optional(),

  /**
   * Hora sugerida en formato HH:MM (24h).
   * Ej: "08:00", "13:30".
   */
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'El formato de hora debe ser HH:MM (ej: "08:00")')
    .optional(),
});

export type AddMealToPlanInput = z.infer<typeof AddMealToPlanSchema>;

// ── Use Case ──────────────────────────────────────────────────────────────────

export class AddMealToPlanUseCase {
  constructor(
    private readonly planRepository: INutritionPlanRepository,
    private readonly mealRepository: IMealRepository,
  ) {}

  async execute(rawInput: AddMealToPlanInput): Promise<MealEntity> {
    // ── 1. Validar entrada ──────────────────────────────────────────────────
    const input = AddMealToPlanSchema.parse(rawInput);

    // ── 2. Verificar que el plan existe ────────────────────────────────────
    const plan = await this.planRepository.findByIdWithRelations(input.nutritionPlanId);
    if (!plan) {
      throw new PlanNotFoundError(input.nutritionPlanId);
    }

    // ── 3. Resolver el orden (auto-incremento si no se provee) ─────────────
    const resolvedOrder =
      input.order ?? plan.meals.length + 1;

    // ── 4. Crear la comida ─────────────────────────────────────────────────
    const meal = await this.mealRepository.create({
      nutritionPlanId: input.nutritionPlanId,
      name: input.name,
      order: resolvedOrder,
      time: input.time ?? null,
    });

    return meal;
  }
}
