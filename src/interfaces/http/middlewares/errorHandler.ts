/**
 * INTERFACES — Middleware de Manejo de Errores
 * Captura errores de dominio y los convierte a respuestas HTTP adecuadas.
 * Debe registrarse ÚLTIMO en la cadena de middlewares de Express.
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  DomainError,
  IngredientNotFoundError,
  SmaeNotFoundError,
  PlanNotFoundError,
  MealNotFoundError,
  MealSelectionNotFoundError,
  InvalidSelectionReferenceError,
  InvalidSelectionQuantityError,
} from '../../../domain/errors/domain.errors';

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── Errores de validación Zod ───────────────────────────────────────────
  if (error instanceof ZodError) {
    const flattened = error.flatten();
    const response: ApiError = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados son inválidos',
        details: {
          fields: flattened.fieldErrors,
          // En Zod 4, los errores de .refine() a nivel objeto van aquí
          form: flattened.formErrors.length > 0 ? flattened.formErrors : undefined,
        },
      },
    };
    res.status(400).json(response);
    return;
  }

  // ── Errores de Dominio — Not Found ─────────────────────────────────────
  if (
    error instanceof IngredientNotFoundError ||
    error instanceof SmaeNotFoundError ||
    error instanceof PlanNotFoundError ||
    error instanceof MealNotFoundError ||
    error instanceof MealSelectionNotFoundError
  ) {
    const response: ApiError = {
      success: false,
      error: { code: error.code, message: error.message },
    };
    res.status(404).json(response);
    return;
  }

  // ── Errores de Dominio — Validación semántica (422) ──────────────────────
  if (
    error instanceof InvalidSelectionReferenceError ||
    error instanceof InvalidSelectionQuantityError
  ) {
    const response: ApiError = {
      success: false,
      error: { code: error.code, message: error.message },
    };
    res.status(422).json(response);
    return;
  }

  // ── Otros errores de dominio ────────────────────────────────────────────
  if (error instanceof DomainError) {
    const response: ApiError = {
      success: false,
      error: { code: error.code, message: error.message },
    };
    res.status(422).json(response);
    return;
  }

  // ── Errores inesperados (500) ───────────────────────────────────────────
  console.error('[Server Error]', error);
  const response: ApiError = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor',
    },
  };
  res.status(500).json(response);
}
