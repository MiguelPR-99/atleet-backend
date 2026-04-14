/**
 * DOMINIO — Contratos de Repositorio (Nutrition)
 * Interfaces que el dominio necesita. La infraestructura (Prisma)
 * implementa estos contratos — el dominio NUNCA depende de Prisma.
 *
 * Regla de Clean Architecture:
 *   Infrastructure → (implementa) → Domain Interfaces
 *   Application    → (usa)        → Domain Interfaces
 */

import type {
  IngredientEntity,
  IngredientSummary,
  SmaeCategoryEntity,
} from '../entities/nutrition.entities';

// ── DTO de creación ───────────────────────────────────────────────────────────
// Usado solo en la capa Application. El dominio lo define para que
// la infraestructura sepa qué datos necesita crear.

export interface CreateIngredientDTO {
  fdcId?: number;
  dataSource: 'USDA' | 'CUSTOM';
  name: string;
  scientificName?: string;
  brandOwner?: string;
  nutrients?: {
    fdcNutrientId?: number;
    name: string;
    unitName: string;
    amountPer100g: number;
    isMacronutrient?: boolean;
  }[];
  portions?: {
    description: string;
    gramWeight: number;
  }[];
  smaeMapping?: {
    categoryShortCode: string;
    equivalentWeight: number;
    measure: string;
  };
}

// ── Contratos ─────────────────────────────────────────────────────────────────

export interface IIngredientRepository {
  /** Busca un ingrediente por su UUID interno + relaciones completas (motor metabólico) */
  findByIdWithRelations(id: string): Promise<IngredientEntity | null>;

  /** Búsqueda por nombre (parcial, case-insensitive) para el buscador */
  search(query: string, limit?: number): Promise<IngredientSummary[]>;

  /** Busca por FDC ID de USDA */
  findByFdcId(fdcId: number): Promise<IngredientEntity | null>;

  /** Crea un nuevo ingrediente (CUSTOM o USDA importado) */
  create(data: CreateIngredientDTO): Promise<IngredientEntity>;

  /** Verifica si ya existe un ingrediente con ese fdcId (previene duplicados) */
  existsByFdcId(fdcId: number): Promise<boolean>;
}

export interface INutrientRepository {
  /** Obtiene el catálogo completo de nutrientes conocidos */
  findAll(): Promise<
    {
      id: string;
      fdcNutrientId: number | null;
      name: string;
      unitName: string;
      isMacronutrient: boolean;
    }[]
  >;

  /** Upsert: crea el nutriente si no existe, devuelve el existente si ya está */
  upsertByFdcId(data: {
    fdcNutrientId: number;
    name: string;
    unitName: string;
    isMacronutrient: boolean;
  }): Promise<{ id: string }>;
}

export interface ISmaeRepository {
  /** Devuelve el catálogo completo de 22 grupos SMAE (4ta Edición) */
  findAll(): Promise<SmaeCategoryEntity[]>;

  /**
   * Busca una categoría SMAE por su UUID interno.
   * Necesario para el Motor SMAE cuando se recibe un ID desde el frontend.
   */
  findById(id: string): Promise<SmaeCategoryEntity | null>;

  /**
   * Busca una categoría SMAE por su código corto (ej: "FRUTA", "VEG").
   * Punto de entrada desde inputs de usuarios y dietistas.
   */
  findByShortCode(shortCode: string): Promise<SmaeCategoryEntity | null>;

  /**
   * Busca categorías SMAE por nombre (búsqueda parcial, case-insensitive).
   * Permite al buscador incluir grupos SMAE en sus resultados.
   */
  searchByName(query: string, limit?: number): Promise<SmaeCategoryEntity[]>;
}

// ── Gateway Externo: USDA FoodData Central ────────────────────────────────────

/**
 * Nutriente normalizado que devuelve la USDA.
 * Los valores ya vienen por 100g — son la fuente de verdad para el motor USDA.
 */
export interface UsdaNutrient {
  nutrientId: number;
  nutrientName: string;
  unitName: string;
  /** Cantidad por 100g (normalización USDA estándar) */
  value: number;
  /** True para energía, macros principales (CHO, Prot, Grasa) */
  isMacronutrient: boolean;
}

/**
 * Resultado de búsqueda de la USDA ya mapeado al dominio.
 * La traducción de UsdaApiFood → UsdaSearchResult es responsabilidad del Mapper.
 */
export interface UsdaSearchResult {
  fdcId: number;
  description: string;
  brandOwner?: string;
  /** Tipo de BD: 'Foundation', 'SR Legacy', 'Branded', 'Survey (FNDDS)' */
  dataType: string;
  foodNutrients: UsdaNutrient[];
}

/**
 * Puerto de dominio para el gateway externo de la USDA.
 * La infraestructura (UsdaIngredientGateway) implementa este contrato.
 * Los use cases nunca importan ni conocen a `fetch` ni URLs externas.
 */
export interface IUsdaGateway {
  /**
   * Busca alimentos en la API de USDA FoodData Central.
   * Retorna [] si hay timeout, error de red, o la API no responde.
   * El degradado es silencioso para no bloquear resultados locales.
   */
  search(query: string, limit?: number): Promise<UsdaSearchResult[]>;
}

