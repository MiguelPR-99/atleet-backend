/**
 * DOMINIO — Errores de Dominio
 * Errores tipados que los casos de uso pueden lanzar.
 * Los controllers los capturan y convierten a respuestas HTTP.
 */

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class IngredientNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(
      `Ingrediente no encontrado: "${identifier}"`,
      'INGREDIENT_NOT_FOUND',
    );
    this.name = 'IngredientNotFoundError';
  }
}

export class InvalidGramsError extends DomainError {
  constructor(grams: number) {
    super(
      `La cantidad en gramos debe ser mayor a 0. Recibido: ${grams}`,
      'INVALID_GRAMS',
    );
    this.name = 'InvalidGramsError';
  }
}

export class SmaeNotFoundError extends DomainError {
  constructor(shortCode: string) {
    super(
      `Categoría SMAE no encontrada: "${shortCode}"`,
      'SMAE_CATEGORY_NOT_FOUND',
    );
    this.name = 'SmaeNotFoundError';
  }
}

export class DuplicateIngredientError extends DomainError {
  constructor(fdcId: number) {
    super(
      `Ya existe un ingrediente con FDC ID: ${fdcId}`,
      'DUPLICATE_INGREDIENT',
    );
    this.name = 'DuplicateIngredientError';
  }
}

// ── Errores del Constructor de Planes (Fase 5) ────────────────────────────────

export class PlanNotFoundError extends DomainError {
  constructor(planId: string) {
    super(
      `Plan nutricional no encontrado: "${planId}"`,
      'PLAN_NOT_FOUND',
    );
    this.name = 'PlanNotFoundError';
  }
}

export class MealNotFoundError extends DomainError {
  constructor(mealId: string) {
    super(
      `Comida no encontrada: "${mealId}"`,
      'MEAL_NOT_FOUND',
    );
    this.name = 'MealNotFoundError';
  }
}

export class MealSelectionNotFoundError extends DomainError {
  constructor(selectionId: string) {
    super(
      `Selección no encontrada: "${selectionId}"`,
      'MEAL_SELECTION_NOT_FOUND',
    );
    this.name = 'MealSelectionNotFoundError';
  }
}

/**
 * Lanzado cuando una MealSelectionEntity viola la invariante de selección híbrida:
 * debe tener EXACTAMENTE ingredientId O smaeCategoryId, nunca ambos ni ninguno.
 */
export class InvalidSelectionReferenceError extends DomainError {
  constructor() {
    super(
      'Una selección debe referenciar un ingrediente (ingredientId) o un grupo SMAE (smaeCategoryId), no ambos ni ninguno.',
      'INVALID_SELECTION_REFERENCE',
    );
    this.name = 'InvalidSelectionReferenceError';
  }
}

/**
 * Lanzado cuando la cantidad provista no es congruente con el tipo de selección.
 * Ej: Caso B (SMAE) sin `smaeEquivalents`, o Caso A sin gramos ni porción.
 */
export class InvalidSelectionQuantityError extends DomainError {
  constructor(detail: string) {
    super(
      `Cantidad de selección inválida: ${detail}`,
      'INVALID_SELECTION_QUANTITY',
    );
    this.name = 'InvalidSelectionQuantityError';
  }
}

