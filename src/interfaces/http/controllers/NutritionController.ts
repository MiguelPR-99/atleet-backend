/**
 * INTERFACES — NutritionController
 * Traduce HTTP requests → Use Cases → HTTP responses.
 * No contiene lógica de negocio.
 *
 * Responsabilidades:
 *   1. Parsear y validar el request con los DTOs Zod.
 *   2. Llamar al use case correspondiente.
 *   3. Serializar la respuesta con el envelope estándar { success, data }.
 *   4. Propagar errores al errorHandler con next(error).
 */

import type { Request, Response, NextFunction } from 'express';
import { CalculateMetabolicImpactUseCase } from '../../../application/modules/nutrition/use-cases/CalculateMetabolicImpact';
import { CalculateSmaeImpactUseCase } from '../../../application/modules/nutrition/use-cases/CalculateSmaeImpact';
import { SearchIngredientUseCase } from '../../../application/modules/nutrition/use-cases/SearchIngredient';
import { GetSmaeCategoriesUseCase } from '../../../application/modules/nutrition/use-cases/GetSmaeCategories';
import {
  CalculateMetabolicImpactSchema,
  CalculateSmaeImpactSchema,
  SearchIngredientQuerySchema,
} from '../dtos/nutrition.dto';

export class NutritionController {
  constructor(
    private readonly calculateMetabolicImpactUseCase: CalculateMetabolicImpactUseCase,
    private readonly calculateSmaeImpactUseCase: CalculateSmaeImpactUseCase,
    private readonly searchIngredientUseCase: SearchIngredientUseCase,
    private readonly getSmaeCategoriesUseCase: GetSmaeCategoriesUseCase,
  ) {}

  // ── POST /api/nutrition/calculate/metabolic ───────────────────────────────
  // Motor USDA: nutrientes exactos por perfil FDC + equivalentes SMAE derivados
  calculateMetabolic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CalculateMetabolicImpactSchema.parse(req.body);
      const result = await this.calculateMetabolicImpactUseCase.execute({
        ingredientId: dto.ingredientId,
        consumedGrams: dto.consumedGrams,
        smaeEquivalents: dto.smaeEquivalents,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  // ── POST /api/nutrition/calculate/smae ───────────────────────────────────
  // Motor SMAE Directo: macros teóricos por grupo sin ingrediente específico
  calculateSmae = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CalculateSmaeImpactSchema.parse(req.body);
      const result = await this.calculateSmaeImpactUseCase.execute({
        shortCode: dto.shortCode,
        categoryId: dto.categoryId,
        equivalents: dto.equivalents,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  // ── GET /api/nutrition/search?q= ─────────────────────────────────────────
  // Buscador unificado: ingredientes locales + categorías SMAE
  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryDto = SearchIngredientQuerySchema.parse(req.query);
      const results = await this.searchIngredientUseCase.execute({
        query: queryDto.q,
        limit: queryDto.limit,
        includeSmaeCategories: queryDto.includeSmae,
        includeUsda: queryDto.includeUsda,
      });
      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(error);
    }
  };

  // ── GET /api/nutrition/smae/categories ───────────────────────────────────
  // Catálogo completo de los 22 grupos SMAE (4ta Edición)
  listSmaeCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.getSmaeCategoriesUseCase.execute();
      res.status(200).json({
        success: true,
        data: categories,
        count: categories.length,
      });
    } catch (error) {
      next(error);
    }
  };
}
