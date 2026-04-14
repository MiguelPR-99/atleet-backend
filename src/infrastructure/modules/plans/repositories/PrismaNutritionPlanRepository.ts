/**
 * INFRAESTRUCTURA — PrismaNutritionPlanRepository
 * Implementación concreta de INutritionPlanRepository usando Prisma.
 * Convierte modelos Prisma → Entidades de Dominio (sin exponer Prisma a capas superiores).
 */

import type { PrismaClient } from '@prisma/client';
import type { INutritionPlanRepository } from '../../../../domain/modules/plans/repositories/plan.repositories';
import type {
  NutritionPlanEntity,
  NutritionPlanSummary,
  MealEntity,
  MealSelectionEntity,
  SelectionType,
  QuantityMode,
} from '../../../../domain/modules/plans/entities/plan.entities';

// ── Tipo helper para el resultado de la query completa ────────────────────────

type PrismaPlanFull = Awaited<
  ReturnType<typeof PrismaNutritionPlanRepository.prototype['_findByIdQuery']>
>;

// ── Repositorio ───────────────────────────────────────────────────────────────

export class PrismaNutritionPlanRepository implements INutritionPlanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Query interna (tipado helper) ─────────────────────────────────────────
  async _findByIdQuery(planId: string) {
    return this.prisma.nutritionPlan.findUnique({
      where: { id: planId },
      include: {
        meals: {
          orderBy: { order: 'asc' },
          include: {
            selections: true,
          },
        },
      },
    });
  }

  // ── findByIdWithRelations ─────────────────────────────────────────────────
  async findByIdWithRelations(planId: string): Promise<NutritionPlanEntity | null> {
    const raw = await this._findByIdQuery(planId);
    if (!raw) return null;
    return this._toDomainEntity(raw);
  }

  // ── findAll ───────────────────────────────────────────────────────────────
  async findAll(): Promise<NutritionPlanSummary[]> {
    const plans = await this.prisma.nutritionPlan.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { meals: true } },
      },
    });

    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      mealCount: p._count.meals,
      createdAt: p.createdAt,
    }));
  }

  // ── create ────────────────────────────────────────────────────────────────
  async create(
    data: Omit<NutritionPlanEntity, 'id' | 'meals' | 'createdAt' | 'updatedAt'>,
  ): Promise<NutritionPlanEntity> {
    const created = await this.prisma.nutritionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        targetKcal: data.targets?.kcal,
        targetProteins: data.targets?.proteins,
        targetCarbs: data.targets?.carbs,
        targetFats: data.targets?.fats,
      },
      include: {
        meals: {
          orderBy: { order: 'asc' },
          include: { selections: true },
        },
      },
    });

    return this._toDomainEntity(created);
  }

  // ── update ────────────────────────────────────────────────────────────────
  async update(
    planId: string,
    data: Partial<Omit<NutritionPlanEntity, 'id' | 'meals' | 'createdAt' | 'updatedAt'>>,
  ): Promise<NutritionPlanEntity> {
    const updated = await this.prisma.nutritionPlan.update({
      where: { id: planId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.targets !== undefined && {
          targetKcal: data.targets?.kcal,
          targetProteins: data.targets?.proteins,
          targetCarbs: data.targets?.carbs,
          targetFats: data.targets?.fats,
        }),
      },
      include: {
        meals: {
          orderBy: { order: 'asc' },
          include: { selections: true },
        },
      },
    });

    return this._toDomainEntity(updated);
  }

  // ── delete ────────────────────────────────────────────────────────────────
  async delete(planId: string): Promise<void> {
    // onDelete: Cascade en Meal y MealSelection se encarga del resto
    await this.prisma.nutritionPlan.delete({ where: { id: planId } });
  }

  // ── Mapper: Prisma → Dominio ───────────────────────────────────────────────
  private _toDomainEntity(raw: NonNullable<PrismaPlanFull>): NutritionPlanEntity {
    const hasTargets =
      raw.targetKcal !== null ||
      raw.targetProteins !== null ||
      raw.targetCarbs !== null ||
      raw.targetFats !== null;

    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      targets: hasTargets
        ? {
            kcal: raw.targetKcal ?? undefined,
            proteins: raw.targetProteins ?? undefined,
            carbs: raw.targetCarbs ?? undefined,
            fats: raw.targetFats ?? undefined,
          }
        : null,
      meals: raw.meals.map((m) => this._mealToDomain(m)),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private _mealToDomain(
    m: NonNullable<PrismaPlanFull>['meals'][number],
  ): MealEntity {
    return {
      id: m.id,
      nutritionPlanId: m.nutritionPlanId,
      name: m.name,
      order: m.order,
      time: m.time,
      selections: m.selections.map((s) => this._selectionToDomain(s)),
    };
  }

  private _selectionToDomain(
    s: NonNullable<PrismaPlanFull>['meals'][number]['selections'][number],
  ): MealSelectionEntity {
    const type: SelectionType = s.ingredientId ? 'ingredient' : 'smae';

    let quantityMode: QuantityMode | undefined;
    if (type === 'ingredient') {
      quantityMode = s.portionId ? 'portion' : 'grams';
    }

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
