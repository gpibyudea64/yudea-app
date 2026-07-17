/*
  Warnings:

  - You are about to drop the column `name` on the `Member` table. All the data in the column will be lost.
  - Made the column `phone` on table `Member` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Member_birthCity_idx";

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "name",
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "firstName" DROP DEFAULT,
ALTER COLUMN "birthCity" DROP DEFAULT,
ALTER COLUMN "statusBaptis" DROP NOT NULL,
ALTER COLUMN "statusSidi" DROP NOT NULL,
ALTER COLUMN "statusPerkawinan" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Attendance_serviceDate_idx" ON "Attendance"("serviceDate");

-- CreateIndex
CREATE INDEX "Attendance_serviceType_idx" ON "Attendance"("serviceType");

-- CreateIndex
CREATE INDEX "Branch_name_idx" ON "Branch"("name");

-- CreateIndex
CREATE INDEX "Family_regionId_idx" ON "Family"("regionId");

-- CreateIndex
CREATE INDEX "Family_familyName_idx" ON "Family"("familyName");

-- CreateIndex
CREATE INDEX "Member_familyId_idx" ON "Member"("familyId");

-- CreateIndex
CREATE INDEX "Member_isActive_idx" ON "Member"("isActive");

-- CreateIndex
CREATE INDEX "Member_isPresbyter_idx" ON "Member"("isPresbyter");

-- CreateIndex
CREATE INDEX "Member_gender_idx" ON "Member"("gender");

-- CreateIndex
CREATE INDEX "Member_pelkat_idx" ON "Member"("pelkat");

-- CreateIndex
CREATE INDEX "Member_birthDate_idx" ON "Member"("birthDate");

-- CreateIndex
CREATE INDEX "Region_branchId_idx" ON "Region"("branchId");

-- CreateIndex
CREATE INDEX "Region_name_idx" ON "Region"("name");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_regionId_idx" ON "User"("regionId");
