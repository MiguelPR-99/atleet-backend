/**
 * INFRAESTRUCTURA — PrismaMealSelectionRepository
 * Implementación concreta de IMealSelectionRepository usando Prisma.
 *
 * REGLA: Este repositorio ESCRIBE selecciones.
 * La LECTURA de selecciones se hace siempre desde el padre (Meal o Plan),
 * a través de PrismaMealRepository o PrismaNutritionPlanRepository (include).
 */

import type { PrismaClient } from '@prisma/client';
import type { IMealSelectionRepository } from '../../../../domain/modules/plans/repositories/plan.repositories';
import type {
  MealSelectionEntity,
  SelectionType,
  QuantityMode,
} from '../../../../domain/modules/plans/entities/plan.entities';

export class PrismaMealSelectionRepository implements IMealSelectionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── create ────────────────────────────────────────────────────────────────
  async create(data: Omit<MealSelectionEntity, 'id'>): Promise<MealSelectionEntity> {
    const created = await this.prisma.mealSelection.create({
      data: {
        mealId: data.mealId,
        ingredientId: data.ingredientId ?? null,
        smaeCategoryId: data.smaeCategoryId ?? null,
        consumedGrams: data.consumedGrams ?? null,
        portionId: data.portionId ?? null,
        portionQty: data.portionQty ?? null,
        smaeEquivalents: data.smaeEquivalents ?? null,
        notes: data.notes ?? null,
      },
    });

    return this._toDomainEntity(created);
  }

  // ── update ────────────────────────────────────────────────────────────────
  async update(
    selectionId: string,
    data: Partial<Omit<MealSelectionEntity, 'id' | 'mealId' | 'type'>>,
  ): Promise<MealSelectionEntity> {
    const updated = await this.prisma.mealSelection.update({
      where: { id: selectionId },
      data: {
        // Solo se actualiza lo que llega explícitamente (undefined = sin cambio)
        ...(data.consumedGrams !== undefined && { consumedGrams: data.consumedGrams }),
        ...(data.portionId !== undefined && { portionId: data.portionId }),
        ...(data.portionQty !== undefined && { portionQty: data.portionQty }),
        ...(data.smaeEquivalents !== undefined && { smaeEquivalents: data.smaeEquivalents }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return this._toDomainEntity(updated);
  }

  // ── delete ────────────────────────────────────────────────────────────────
  async delete(selectionId: string): Promise<void> {
    await this.prisma.mealSelection.delete({ where: { id: selectionId } });
  }

  // ── Mapper: Prisma → Dominio ───────────────────────────────────────────────
  private _toDomainEntity(
    s: Awaited<ReturnType<typeof this.prisma.mealSelection.create>>,
  ): MealSelectionEntity {
    const type: SelectionType = s.ingredientId ? 'ingredient' : 'smae';
    const quantityMode: QuantityMode | undefined =
      type === 'ingredient' ? (s.portionId ? 'portion' : 'grams') : undefined;

    return {
      id: s.id,
      mealId: s.mealId,
      type,
      ingredientId: s.ingredientId ?? undefined,
      smaeCategoryId: s.smaeCategoryId ?? undefined,
      quantityMode,
      consumedGrams: s.consumedGrams ?? undefined,
      portionId: s.portionId ?? undefined,
      portionQty: s.portionQty ?? undefined,
      smaeEquivalents: s.smaeEquivalents ?? undefined,
      notes: s.notes ?? undefined,
    };
  }
}
