/*
  Warnings:

  - You are about to drop the column `isPresbyter` on the `Member` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX IF EXISTS "Member_isPresbyter_idx";

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "isPresbyter";
