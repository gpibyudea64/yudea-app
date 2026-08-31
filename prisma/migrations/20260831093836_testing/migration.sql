-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "jabatan" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Family_regionId_familyName_idx" ON "Family"("regionId", "familyName");

-- CreateIndex
CREATE INDEX "Member_isActive_isDeceased_idx" ON "Member"("isActive", "isDeceased");

-- CreateIndex
CREATE INDEX "Member_familyId_isActive_idx" ON "Member"("familyId", "isActive");

-- CreateIndex
CREATE INDEX "Member_pelkat_isActive_idx" ON "Member"("pelkat", "isActive");
