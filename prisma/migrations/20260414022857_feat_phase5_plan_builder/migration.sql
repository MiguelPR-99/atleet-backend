-- CreateTable
CREATE TABLE "nutrition_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetKcal" DOUBLE PRECISION,
    "targetProteins" DOUBLE PRECISION,
    "targetCarbs" DOUBLE PRECISION,
    "targetFats" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" TEXT NOT NULL,
    "nutritionPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "time" TEXT,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_selections" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "ingredientId" TEXT,
    "smaeCategoryId" TEXT,
    "consumedGrams" DOUBLE PRECISION,
    "portionId" TEXT,
    "portionQty" DOUBLE PRECISION,
    "smaeEquivalents" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "meal_selections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_nutritionPlanId_fkey" FOREIGN KEY ("nutritionPlanId") REFERENCES "nutrition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_selections" ADD CONSTRAINT "meal_selections_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_selections" ADD CONSTRAINT "meal_selections_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_selections" ADD CONSTRAINT "meal_selections_smaeCategoryId_fkey" FOREIGN KEY ("smaeCategoryId") REFERENCES "smae_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_selections" ADD CONSTRAINT "meal_selections_portionId_fkey" FOREIGN KEY ("portionId") REFERENCES "ingredient_portions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
