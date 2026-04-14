/**
 * INTERFACES — PlanController
 * Traduce HTTP requests → Use Cases → HTTP responses.
 * No contiene lógica de negocio.
 *
 * Responsabilidades:
 *   1. Parsear parámetros de URL y body.
 *   2. Llamar al use case correspondiente.
 *   3. Serializar la respuesta con el envelope estándar { success, data }.
 *   4. Propagar errores al errorHandler con next(error).
 *
 * Endpoints manejados:
 *   POST   /api/plans                          → createPlan
 *   GET    /api/plans                          → listPlans
 *   GET    /api/plans/:planId                  → getPlan
 *   POST   /api/plans/:planId/meals            → addMealToPlan
 *   POST   /api/meals/:mealId/selections       → addSelectionToMeal
 *   GET    /api/meals/:mealId/totals           → getMealTotals
 */

import type { Request, Response, NextFunction } from 'express';
import type { CreatePlanUseCase } from '../../../application/modules/plans/use-cases/CreatePlan';
import type { AddMealToPlanUseCase } from '../../../application/modules/plans/use-cases/AddMealToPlan';
import type { AddSelectionToMealUseCase } from '../../../application/modules/plans/use-cases/AddSelectionToMeal';
import type { CalculateMealTotalsUseCase } from '../../../application/modules/plans/use-cases/CalculateMealTotals';
import type { INutritionPlanRepository } from '../../../domain/modules/plans/repositories/plan.repositories';

export class PlanController {
  constructor(
    private readonly createPlanUseCase: CreatePlanUseCase,
    private readonly addMealToPlanUseCase: AddMealToPlanUseCase,
    private readonly addSelectionToMealUseCase: AddSelectionToMealUseCase,
    private readonly calculateMealTotalsUseCase: CalculateMealTotalsUseCase,
    private readonly planRepository: INutritionPlanRepository,
  ) {}

  // ── POST /api/plans ────────────────────────────────────────────────────────
  createPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plan = await this.createPlanUseCase.execute(req.body);
      res.status(201).json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  };

  // ── GET /api/plans ─────────────────────────────────────────────────────────
  listPlans = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plans = await this.planRepository.findAll();
      res.status(200).json({ success: true, data: plans, count: plans.length });
    } catch (error) {
      next(error);
    }
  };

  // ── GET /api/plans/:planId ──────────────────────────────────────────────────
  getPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const planId = String(req.params.planId);
      const plan = await this.planRepository.findByIdWithRelations(planId);
      if (!plan) {
        res.status(404).json({
          success: false,
          error: { code: 'PLAN_NOT_FOUND', message: `Plan no encontrado: "${planId}"` },
        });
        return;
      }
      res.status(200).json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  };

  // ── POST /api/plans/:planId/meals ──────────────────────────────────────────
  addMealToPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meal = await this.addMealToPlanUseCase.execute({
        ...req.body,
        nutritionPlanId: req.params.planId,
      });
      res.status(201).json({ success: true, data: meal });
    } catch (error) {
      next(error);
    }
  };

  // ── POST /api/meals/:mealId/selections ─────────────────────────────────────
  addSelectionToMeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const selection = await this.addSelectionToMealUseCase.execute({
        ...req.body,
        mealId: req.params.mealId,
      });
      res.status(201).json({ success: true, data: selection });
    } catch (error) {
      next(error);
    }
  };

  // ── GET /api/meals/:mealId/totals ──────────────────────────────────────────
  getMealTotals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const totals = await this.calculateMealTotalsUseCase.execute({
        mealId: String(req.params.mealId),
      });
      res.status(200).json({ success: true, data: totals });
    } catch (error) {
      next(error);
    }
  };
}
