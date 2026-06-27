-- Add tanggalPindah column to Member table
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "tanggalPindah" TIMESTAMP(3);
