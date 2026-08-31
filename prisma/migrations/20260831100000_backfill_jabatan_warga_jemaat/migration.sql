-- Backfill existing members with null jabatan to WARGA_JEMAAT
UPDATE "Member" SET "jabatan" = 'WARGA_JEMAAT' WHERE "jabatan" IS NULL;

-- Set default value for jabatan column
ALTER TABLE "Member" ALTER COLUMN "jabatan" SET DEFAULT 'WARGA_JEMAAT';

-- Make jabatan NOT NULL now that all rows have a value
ALTER TABLE "Member" ALTER COLUMN "jabatan" SET NOT NULL;
