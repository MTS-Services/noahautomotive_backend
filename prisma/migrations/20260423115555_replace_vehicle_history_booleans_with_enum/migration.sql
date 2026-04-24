/*
  Warnings:

  - You are about to drop the column `noAccidents` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `noDamage` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `noTheft` on the `listings` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VehicleHistory" AS ENUM ('NO_ACCIDENTS_REPORTED', 'NO_THEFT_HISTORY_REPORTED', 'NO_VEHICLE_DAMAGE_REPORTED');

-- AlterTable
ALTER TABLE "listings" DROP COLUMN "noAccidents",
DROP COLUMN "noDamage",
DROP COLUMN "noTheft",
ADD COLUMN     "vehicleHistory" "VehicleHistory"[];
