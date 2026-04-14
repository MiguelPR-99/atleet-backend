/**
 * INFRAESTRUCTURA — PrismaSmaeRepository
 * Implementación concreta de ISmaeRepository usando Prisma.
 * Convierte modelos de Prisma a entidades de dominio.
 * La capa de Application nunca ve este archivo directamente.
 */

import type { PrismaClient } from '@prisma/client';
import type { ISmaeRepository } from '../../../../domain/modules/nutrition/repositories/nutrition.repositories';
import type { SmaeCategoryEntity } from '../../../../domain/modules/nutrition/entities/nutrition.entities';

export class PrismaSmaeRepository implements ISmaeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Mapper: Prisma → Entidad de Dominio ──────────────────────────────────────
  private _toEntity(c: {
    id: string;
    name: string;
    shortCode: string;
    avgCarbs: number;
    avgProteins: number;
    avgFats: number;
    avgKcal: number;
  }): SmaeCategoryEntity {
    return {
      id: c.id,
      name: c.name,
      shortCode: c.shortCode,
      avgCarbs: c.avgCarbs,
      avgProteins: c.avgProteins,
      avgFats: c.avgFats,
      avgKcal: c.avgKcal,
    };
  }

  async findAll(): Promise<SmaeCategoryEntity[]> {
    const categories = await this.prisma.smaeCategory.findMany({
      orderBy: { shortCode: 'asc' },
    });
    return categories.map(this._toEntity);
  }

  async findById(id: string): Promise<SmaeCategoryEntity | null> {
    const category = await this.prisma.smaeCategory.findUnique({
      where: { id },
    });
    if (!category) return null;
    return this._toEntity(category);
  }

  async findByShortCode(shortCode: string): Promise<SmaeCategoryEntity | null> {
    const category = await this.prisma.smaeCategory.findUnique({
      where: { shortCode },
    });
    if (!category) return null;
    return this._toEntity(category);
  }

  async searchByName(query: string, limit = 22): Promise<SmaeCategoryEntity[]> {
    const categories = await this.prisma.smaeCategory.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
    return categories.map(this._toEntity);
  }
}
