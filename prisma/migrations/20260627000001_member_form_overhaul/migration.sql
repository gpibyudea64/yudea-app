-- Add new enum values to MemberRole
ALTER TYPE "MemberRole" ADD VALUE IF NOT EXISTS 'ORANG_TUA';
ALTER TYPE "MemberRole" ADD VALUE IF NOT EXISTS 'CUCU';
ALTER TYPE "MemberRole" ADD VALUE IF NOT EXISTS 'KAKAK_ADIK_KANDUNG';
ALTER TYPE "MemberRole" ADD VALUE IF NOT EXISTS 'FAMILI_LAIN';

-- Add new columns to Member table
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "birthCity" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "childNumber" INTEGER;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "sameAddressAsFamily" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "memberAddress" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "memberProvinsi" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "memberKotaKabupaten" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "memberKecamatan" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "memberKelurahan" TEXT;

-- Copy existing name to firstName (backfill existing data)
UPDATE "Member" SET "firstName" = COALESCE("name", '') WHERE "firstName" = '';

-- Make phone NOT NULL - backfill first then add constraint
UPDATE "Member" SET "phone" = '-' WHERE "phone" IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS "Member_firstName_idx" ON "Member" ("firstName");
CREATE INDEX IF NOT EXISTS "Member_lastName_idx" ON "Member" ("lastName");
CREATE INDEX IF NOT EXISTS "Member_birthCity_idx" ON "Member" ("birthCity");
