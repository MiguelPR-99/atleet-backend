/**
 * INTERFACES — Zod DTOs para el módulo de Nutrición
 * Validan y tipan el cuerpo de los requests HTTP antes de
 * que lleguen a los controllers.
 * Compatible con Zod 4 (usa `message` en lugar de `invalid_type_error`).
 */

import { z } from 'zod';

// ── POST /api/nutrition/calculate/metabolic ───────────────────────────────────
// Motor USDA: recibe un ingrediente concreto + gramos (o equivalentes SMAE)

export const CalculateMetabolicImpactSchema = z.object({
  ingredientId: z
    .string()
    .uuid('ingredientId debe ser un UUID válido'),
  consumedGrams: z
    .number({ message: 'consumedGrams debe ser un número positivo' })
    .positive('consumedGrams debe ser mayor a 0')
    .max(10000, 'consumedGrams no puede exceder 10,000g')
    .optional(),
  smaeEquivalents: z
    .number({ message: 'smaeEquivalents debe ser un número positivo' })
    .positive('smaeEquivalents debe ser mayor a 0')
    .max(50, 'smaeEquivalents no puede exceder 50')
    .optional(),
}).refine(
  (d) => d.consumedGrams !== undefined || d.smaeEquivalents !== undefined,
  { message: 'Debes enviar consumedGrams o smaeEquivalents' },
);

export type CalculateMetabolicImpactDTO = z.infer<typeof CalculateMetabolicImpactSchema>;

// ── POST /api/nutrition/calculate/smae ───────────────────────────────────────
// Motor SMAE Directo: opera con equivalentes teóricos sin ingrediente específico

export const CalculateSmaeImpactSchema = z.object({
  /** Código corto del grupo SMAE (ej: "FRUTA", "VEG", "LECHE-D") */
  shortCode: z
    .string()
    .min(1)
    .max(20)
    .toUpperCase()
    .optional(),
  /** UUID de la categoría SMAE (alternativa a shortCode) */
  categoryId: z
    .string()
    .uuid('categoryId debe ser un UUID válido')
    .optional(),
  /** Número de equivalentes a calcular (permite decimales, ej: 1.5) */
  equivalents: z
    .number({ message: 'equivalents debe ser un número positivo' })
    .positive('equivalents debe ser mayor a 0')
    .max(50, 'equivalents no puede exceder 50'),
}).refine(
  (d) => d.shortCode !== undefined || d.categoryId !== undefined,
  { message: 'Debes enviar shortCode o categoryId de la categoría SMAE' },
);

export type CalculateSmaeImpactDTO = z.infer<typeof CalculateSmaeImpactSchema>;

// ── GET /api/nutrition/search?q= ─────────────────────────────────────────────
// Buscador unificado de ingredientes + categorías SMAE

export const SearchIngredientQuerySchema = z.object({
  q: z
    .string()
    .min(2, 'La búsqueda debe tener al menos 2 caracteres')
    .max(100, 'La búsqueda no puede superar los 100 caracteres'),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().min(1).max(50)),
  /** Incluir categorías SMAE en los resultados (default: true) */
  includeSmae: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v !== 'false'),
  /** Incluir resultados de la API USDA FoodData Central (default: true) */
  includeUsda: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v !== 'false'),
});

export type SearchIngredientQueryDTO = z.infer<typeof SearchIngredientQuerySchema>;
