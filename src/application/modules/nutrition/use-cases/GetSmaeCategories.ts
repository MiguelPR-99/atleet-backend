/**
 * CASO DE USO — GetSmaeCategories
 * Devuelve el catálogo completo de 22 grupos SMAE.
 */

import type { SmaeCategoryEntity } from '../../../../domain/modules/nutrition/entities/nutrition.entities';
import type { ISmaeRepository } from '../../../../domain/modules/nutrition/repositories/nutrition.repositories';

export class GetSmaeCategoriesUseCase {
  constructor(private readonly smaeRepository: ISmaeRepository) {}

  async execute(): Promise<SmaeCategoryEntity[]> {
    return this.smaeRepository.findAll();
  }
}
