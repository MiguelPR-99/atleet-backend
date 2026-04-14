/**
 * INFRAESTRUCTURA — PrismaIngredientRepository
 * Implementación concreta del contrato IIngredientRepository usando Prisma.
 * Convierte modelos de Prisma a entidades de dominio.
 */

import type { PrismaClient } from '@prisma/client';
import type {
  IIngredientRepository,
  CreateIngredientDTO,
} from '../../../../domain/modules/nutrition/repositories/nutrition.repositories';
import type {
  IngredientEntity,
  IngredientSummary,
} from '../../../../domain/modules/nutrition/entities/nutrition.entities';

type PrismaIngredientFull = Awaited<
  ReturnType<typeof PrismaIngredientRepository.prototype['_findByIdQuery']>
>;

export class PrismaIngredientRepository implements IIngredientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Query interna (tipado helper) ─────────────────────────────────────────
  async _findByIdQuery(id: string) {
    return this.prisma.ingredient.findUnique({
      where: { id },
      include: {
        nutrients: {
          include: { nutrient: true },
        },
        portions: true,
        smaeMapping: {
          include: { category: true },
        },
      },
    });
  }

  async findByIdWithRelations(id: string): Promise<IngredientEntity | null> {
    const raw = await this._findByIdQuery(id);
    if (!raw) return null;
    return this._toDomainEntity(raw);
  }

  async findByFdcId(fdcId: number): Promise<IngredientEntity | null> {
    const raw = await this.prisma.ingredient.findUnique({
      where: { fdcId },
      include: {
        nutrients: { include: { nutrient: true } },
        portions: true,
        smaeMapping: { include: { category: true } },
      },
    });
    if (!raw) return null;
    return this._toDomainEntity(raw);
  }

  async search(query: string, limit = 20): Promise<IngredientSummary[]> {
    const results = await this.prisma.ingredient.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      select: {
        id: true,
        fdcId: true,
        dataSource: true,
        name: true,
        smaeMapping: { select: { id: true } },
      },
      orderBy: { name: 'asc' },
    });

    return results.map((r) => ({
      id: r.id,
      fdcId: r.fdcId,
      dataSource: r.dataSource as 'USDA' | 'CUSTOM',
      name: r.name,
      hasSmaeMapping: r.smaeMapping !== null,
    }));
  }

  async existsByFdcId(fdcId: number): Promise<boolean> {
    const count = await this.prisma.ingredient.count({ where: { fdcId } });
    return count > 0;
  }

  async create(data: CreateIngredientDTO): Promise<IngredientEntity> {
    const created = await this.prisma.ingredient.create({
      data: {
        fdcId: data.fdcId,
        dataSource: data.dataSource,
        name: data.name,
        scientificName: data.scientificName,
        brandOwner: data.brandOwner,
        nutrients: data.nutrients
          ? {
              create: data.nutrients.map((n: NonNullable<CreateIngredientDTO['nutrients']>[number]) => ({
                amountPer100g: n.amountPer100g,
                nutrient: {
                  connectOrCreate: {
                    where: { fdcNutrientId: n.fdcNutrientId ?? -1 },
                    create: {
                      fdcNutrientId: n.fdcNutrientId,
                      name: n.name,
                      unitName: n.unitName,
                      isMacronutrient: n.isMacronutrient ?? false,
                    },
                  },
                },
              })),
            }
          : undefined,
        portions: data.portions
          ? { create: data.portions }
          : undefined,
      },
      include: {
        nutrients: { include: { nutrient: true } },
        portions: true,
        smaeMapping: { include: { category: true } },
      },
    });

    return this._toDomainEntity(created);
  }

  // ── Mapper: Prisma → Entidad de Dominio ────────────────────────────────────
  private _toDomainEntity(raw: NonNullable<PrismaIngredientFull>): IngredientEntity {
    return {
      id: raw.id,
      fdcId: raw.fdcId,
      dataSource: raw.dataSource as 'USDA' | 'CUSTOM',
      name: raw.name,
      scientificName: raw.scientificName,
      brandOwner: raw.brandOwner,
      nutrients: raw.nutrients.map((n) => ({
        nutrientId: n.nutrientId,
        nutrientName: n.nutrient.name,
        unitName: n.nutrient.unitName,
        amountPer100g: n.amountPer100g,
        isMacronutrient: n.nutrient.isMacronutrient,
      })),
      portions: raw.portions.map((p) => ({
        id: p.id,
        description: p.description,
        gramWeight: p.gramWeight,
      })),
      smaeMapping: raw.smaeMapping
        ? {
            categoryId: raw.smaeMapping.categoryId,
            categoryName: raw.smaeMapping.category.name,
            shortCode: raw.smaeMapping.category.shortCode,
            equivalentWeight: raw.smaeMapping.equivalentWeight,
            measure: raw.smaeMapping.measure,
          }
        : null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
