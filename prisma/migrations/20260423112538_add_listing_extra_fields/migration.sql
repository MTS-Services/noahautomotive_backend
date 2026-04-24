-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "engineSize" DECIMAL(3,1),
ADD COLUMN     "fuelEconomy" INTEGER,
ADD COLUMN     "noAccidents" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "noDamage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "noTheft" BOOLEAN NOT NULL DEFAULT false;
