-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('SUV', 'SEDAN', 'HATCHBACK', 'HYBRID', 'CONVERTIBLE');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "type" "VehicleType";
