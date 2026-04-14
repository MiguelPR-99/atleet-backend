-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('USDA', 'CUSTOM');

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "fdcId" INTEGER,
    "dataSource" "DataSource" NOT NULL DEFAULT 'USDA',
    "name" TEXT NOT NULL,
    "scientificName" TEXT,
    "brandOwner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrients" (
    "id" TEXT NOT NULL,
    "fdcNutrientId" INTEGER,
    "name" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "isMacronutrient" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "nutrients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_nutrients" (
    "ingredientId" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "amountPer100g" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ingredient_nutrients_pkey" PRIMARY KEY ("ingredientId","nutrientId")
);

-- CreateTable
CREATE TABLE "ingredient_portions" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gramWeight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ingredient_portions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smae_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "avgCarbs" DOUBLE PRECISION NOT NULL,
    "avgProteins" DOUBLE PRECISION NOT NULL,
    "avgFats" DOUBLE PRECISION NOT NULL,
    "avgKcal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "smae_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smae_mappings" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "equivalentWeight" DOUBLE PRECISION NOT NULL,
    "measure" TEXT NOT NULL,

    CONSTRAINT "smae_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_fdcId_key" ON "ingredients"("fdcId");

-- CreateIndex
CREATE UNIQUE INDEX "nutrients_fdcNutrientId_key" ON "nutrients"("fdcNutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "smae_categories_shortCode_key" ON "smae_categories"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "smae_mappings_ingredientId_key" ON "smae_mappings"("ingredientId");

-- AddForeignKey
ALTER TABLE "ingredient_nutrients" ADD CONSTRAINT "ingredient_nutrients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_nutrients" ADD CONSTRAINT "ingredient_nutrients_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "nutrients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_portions" ADD CONSTRAINT "ingredient_portions_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smae_mappings" ADD CONSTRAINT "smae_mappings_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smae_mappings" ADD CONSTRAINT "smae_mappings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "smae_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
