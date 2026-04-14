/**
 * TESTS — CalculateMetabolicImpact Use Case
 * Valida la lógica de "Precisión Inteligente" de la Biblia Técnica.
 * Usa un mock del repositorio — sin base de datos real.
 */

import { describe, it, expect, vi } from 'vitest';
import { CalculateMetabolicImpactUseCase } from '../../../src/application/modules/nutrition/use-cases/CalculateMetabolicImpact';
import { resolveGramsFromEquivalents } from '../../../src/application/modules/nutrition/use-cases/CalculateMetabolicImpact';
import type { IIngredientRepository } from '../../../src/domain/modules/nutrition/repositories/nutrition.repositories';
import type { IngredientEntity } from '../../../src/domain/modules/nutrition/entities/nutrition.entities';
import {
  IngredientNotFoundError,
  InvalidGramsError,
} from '../../../src/domain/errors/domain.errors';

// ── Mock: Pechuga de pollo cruda con SMAE ────────────────────────────────────
const mockPollo: IngredientEntity = {
  id: 'test-pollo-uuid',
  fdcId: 171477,
  dataSource: 'USDA',
  name: 'Pollo, pechuga, carne cruda',
  scientificName: null,
  brandOwner: null,
  nutrients: [
    {
      nutrientId: 'nut-protein',
      nutrientName: 'Protein',
      unitName: 'g',
      amountPer100g: 23.2,  // USDA FDC valor real
      isMacronutrient: true,
    },
    {
      nutrientId: 'nut-lipid',
      nutrientName: 'Total lipid (fat)',
      unitName: 'g',
      amountPer100g: 1.24,
      isMacronutrient: true,
    },
    {
      nutrientId: 'nut-kcal',
      nutrientName: 'Energy',
      unitName: 'kcal',
      amountPer100g: 110,
      isMacronutrient: false,
    },
  ],
  portions: [{ id: 'p1', description: '1 pieza mediana (sin hueso)', gramWeight: 130 }],
  smaeMapping: {
    categoryId: 'cat-aoa-mb',
    categoryName: 'Alimentos de origen animal (Muy bajo aporte de grasa)',
    shortCode: 'AOA-MB',
    equivalentWeight: 30, // 30g = 1 Equivalente SMAE para pollo
    measure: '30 gramos',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Mock del repositorio ──────────────────────────────────────────────────────
const mockRepo: IIngredientRepository = {
  findByIdWithRelations: vi.fn().mockResolvedValue(mockPollo),
  search: vi.fn().mockResolvedValue([]),
  findByFdcId: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  existsByFdcId: vi.fn().mockResolvedValue(false),
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('CalculateMetabolicImpactUseCase — Motor Metabólico', () => {
  const useCase = new CalculateMetabolicImpactUseCase(mockRepo);

  it('calcula correctamente el impacto de 150g de pollo', async () => {
    const result = await useCase.execute({
      ingredientId: 'test-pollo-uuid',
      consumedGrams: 150,
    });

    // Fórmula: (amountPer100g / 100) * consumedGrams
    expect(result.consumedGrams).toBe(150);
    expect(result.ingredientName).toBe('Pollo, pechuga, carne cruda');

    const protein = result.nutrients.find((n) => n.nutrientName === 'Protein');
    expect(protein?.calculatedAmount).toBe(parseFloat(((23.2 / 100) * 150).toFixed(2)));
    // 23.2 / 100 * 150 = 34.80g de proteína
    expect(protein?.calculatedAmount).toBe(34.8);
  });

  it('calcula correctamente los equivalentes SMAE (150g / 30g = 5 eq)', async () => {
    const result = await useCase.execute({
      ingredientId: 'test-pollo-uuid',
      consumedGrams: 150,
    });

    expect(result.smaeEquivalents).toBe(5);
    expect(result.smaeCategory).toBe('AOA-MB');
  });

  it('devuelve smaeEquivalents = null cuando el ingrediente no tiene mapeo SMAE', async () => {
    const polloSinSmae: IngredientEntity = { ...mockPollo, smaeMapping: null };
    const repoSinSmae: IIngredientRepository = {
      ...mockRepo,
      findByIdWithRelations: vi.fn().mockResolvedValue(polloSinSmae),
    };

    const result = await new CalculateMetabolicImpactUseCase(repoSinSmae).execute({
      ingredientId: 'test-pollo-uuid',
      consumedGrams: 100,
    });

    expect(result.smaeEquivalents).toBeNull();
    expect(result.smaeCategory).toBeNull();
  });

  it('lanza IngredientNotFoundError si el ingrediente no existe', async () => {
    const repoVacio: IIngredientRepository = {
      ...mockRepo,
      findByIdWithRelations: vi.fn().mockResolvedValue(null),
    };

    await expect(
      new CalculateMetabolicImpactUseCase(repoVacio).execute({
        ingredientId: 'uuid-inexistente',
        consumedGrams: 100,
      }),
    ).rejects.toThrow(IngredientNotFoundError);
  });

  it('lanza InvalidGramsError si consumedGrams <= 0', async () => {
    await expect(
      useCase.execute({ ingredientId: 'test-pollo-uuid', consumedGrams: 0 }),
    ).rejects.toThrow(InvalidGramsError);

    await expect(
      useCase.execute({ ingredientId: 'test-pollo-uuid', consumedGrams: -50 }),
    ).rejects.toThrow(InvalidGramsError);
  });
});

describe('resolveGramsFromEquivalents — Función auxiliar', () => {
  it('convierte 5 equivalentes SMAE a 150g (equivalentWeight = 30)', () => {
    const grams = resolveGramsFromEquivalents(5, 30);
    expect(grams).toBe(150);
  });

  it('convierte 0.5 equivalentes a 15g', () => {
    const grams = resolveGramsFromEquivalents(0.5, 30);
    expect(grams).toBe(15);
  });

  it('lanza error si equivalents <= 0', () => {
    expect(() => resolveGramsFromEquivalents(0, 30)).toThrow(InvalidGramsError);
  });
});
