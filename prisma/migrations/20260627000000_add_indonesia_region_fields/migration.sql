-- Add Indonesian administrative region columns to Family table
ALTER TABLE "Family" ADD COLUMN IF NOT EXISTS "provinsi" TEXT;
ALTER TABLE "Family" ADD COLUMN IF NOT EXISTS "kotaKabupaten" TEXT;
ALTER TABLE "Family" ADD COLUMN IF NOT EXISTS "kecamatan" TEXT;
ALTER TABLE "Family" ADD COLUMN IF NOT EXISTS "kelurahan" TEXT;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS "Family_kotaKabupaten_idx" ON "Family" ("kotaKabupaten");
CREATE INDEX IF NOT EXISTS "Family_kecamatan_idx" ON "Family" ("kecamatan");
