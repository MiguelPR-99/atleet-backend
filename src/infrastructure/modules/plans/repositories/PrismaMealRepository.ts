/**
 * INFRAESTRUCTURA — PrismaMealRepository
 * Implementación concreta de IMealRepository usando Prisma.
 */

import type { PrismaClient } from '@prisma/client';
import type { IMealRepository } from '../../../../domain/modules/plans/repositories/plan.repositories';
import type {
  MealEntity,
  MealSelectionEntity,
  SelectionType,
  QuantityMode,
} from '../../../../domain/modules/plans/entities/plan.entities';

type PrismaMealFull = Awaited<
  ReturnType<typeof PrismaMealRepository.prototype['_findByIdQuery']>
>;

export class PrismaMealRepository implements IMealRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Query interna ──────────────────────────────────────────────────────────
  async _findByIdQuery(mealId: string) {
    return this.prisma.meal.findUnique({
      where: { id: mealId },
      include: { selections: true },
    });
  }

  // ── findByIdWithSelections ─────────────────────────────────────────────────
  async findByIdWithSelections(mealId: string): Promise<MealEntity | null> {
    const raw = await this._findByIdQuery(mealId);
    if (!raw) return null;
    return this._toDomainEntity(raw);
  }

  // ── create ────────────────────────────────────────────────────────────────
  async create(data: Omit<MealEntity, 'id' | 'selections'>): Promise<MealEntity> {
    const created = await this.prisma.meal.create({
      data: {
        nutritionPlanId: data.nutritionPlanId,
        name: data.name,
        order: data.order,
        time: data.time ?? null,
      },
      include: { selections: true },
    });

    return this._toDomainEntity(created);
  }

  // ── update ────────────────────────────────────────────────────────────────
  async update(
    mealId: string,
    data: Partial<Omit<MealEntity, 'id' | 'nutritionPlanId' | 'selections'>>,
  ): Promise<MealEntity> {
    const updated = await this.prisma.meal.update({
      where: { id: mealId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.time !== undefined && { time: data.time }),
      },
      include: { selections: true },
    });

    return this._toDomainEntity(updated);
  }

  // ── delete ────────────────────────────────────────────────────────────────
  async delete(mealId: string): Promise<void> {
    // onDelete: Cascade elimina MealSelections automáticamente
    await this.prisma.meal.delete({ where: { id: mealId } });
  }

  // ── Mapper: Prisma → Dominio ───────────────────────────────────────────────
  private _toDomainEntity(raw: NonNullable<PrismaMealFull>): MealEntity {
    return {
      id: raw.id,
      nutritionPlanId: raw.nutritionPlanId,
      name: raw.name,
      order: raw.order,
      time: raw.time,
      selections: raw.selections.map((s) => this._selectionToDomain(s)),
    };
  }

  private _selectionToDomain(
    s: NonNullable<PrismaMealFull>['selections'][number],
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
