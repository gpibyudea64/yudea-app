-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A', 'B', 'AB', 'O');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "bloodType" "BloodType";
