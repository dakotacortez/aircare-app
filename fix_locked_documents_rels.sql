-- Emergency fix for missing database columns
-- This adds ALL missing columns that are causing the application to crash
-- Run this with: psql $DATABASE_URL -f fix_locked_documents_rels.sql

BEGIN;

-- ========================================
-- PART 1: payload_locked_documents_rels
-- ========================================

-- Add missing collection ID columns to payload_locked_documents_rels
ALTER TABLE "payload_locked_documents_rels"
  ADD COLUMN IF NOT EXISTS "hospital_networks_id" integer,
  ADD COLUMN IF NOT EXISTS "hospital_capabilities_id" integer,
  ADD COLUMN IF NOT EXISTS "hospitals_id" integer,
  ADD COLUMN IF NOT EXISTS "hospital_change_requests_id" integer,
  ADD COLUMN IF NOT EXISTS "base_change_requests_id" integer,
  ADD COLUMN IF NOT EXISTS "bases_id" integer,
  ADD COLUMN IF NOT EXISTS "assets_id" integer,
  ADD COLUMN IF NOT EXISTS "calculators_id" integer;

-- Create indexes for the new columns to improve query performance
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_hospital_networks_id_idx"
  ON "payload_locked_documents_rels" USING btree ("hospital_networks_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_hospital_capabilities_id_idx"
  ON "payload_locked_documents_rels" USING btree ("hospital_capabilities_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_hospitals_id_idx"
  ON "payload_locked_documents_rels" USING btree ("hospitals_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_hospital_change_requests_id_idx"
  ON "payload_locked_documents_rels" USING btree ("hospital_change_requests_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_base_change_requests_id_idx"
  ON "payload_locked_documents_rels" USING btree ("base_change_requests_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_bases_id_idx"
  ON "payload_locked_documents_rels" USING btree ("bases_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_assets_id_idx"
  ON "payload_locked_documents_rels" USING btree ("assets_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_calculators_id_idx"
  ON "payload_locked_documents_rels" USING btree ("calculators_id");

-- Add foreign key constraints for referential integrity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_hospital_networks_fk'
  ) THEN
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_hospital_networks_fk"
        FOREIGN KEY ("hospital_networks_id") REFERENCES "hospital_networks"("id")
        ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_hospital_capabilities_fk'
  ) THEN
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_hospital_capabilities_fk"
        FOREIGN KEY ("hospital_capabilities_id") REFERENCES "hospital_capabilities"("id")
        ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_hospitals_fk'
  ) THEN
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_hospitals_fk"
        FOREIGN KEY ("hospitals_id") REFERENCES "hospitals"("id")
        ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_hospital_change_requests_fk'
  ) THEN
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_hospital_change_requests_fk"
        FOREIGN KEY ("hospital_change_requests_id") REFERENCES "hospital_change_requests"("id")
        ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_base_change_requests_fk'
  ) THEN
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_base_change_requests_fk"
        FOREIGN KEY ("base_change_requests_id") REFERENCES "base_change_requests"("id")
        ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_bases_fk'
  ) THEN
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_bases_fk"
        FOREIGN KEY ("bases_id") REFERENCES "bases"("id")
        ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_assets_fk'
  ) THEN
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_assets_fk"
        FOREIGN KEY ("assets_id") REFERENCES "assets"("id")
        ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_calculators_fk'
  ) THEN
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_calculators_fk"
        FOREIGN KEY ("calculators_id") REFERENCES "calculators"("id")
        ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

-- ========================================
-- PART 2: Change Request Tables
-- ========================================

-- Add admin_notes column to base_change_requests
ALTER TABLE "base_change_requests"
  ADD COLUMN IF NOT EXISTS "admin_notes" text;

-- Ensure door codes table has all columns
ALTER TABLE "base_change_requests_proposed_data_door_codes"
  ADD COLUMN IF NOT EXISTS "label" varchar,
  ADD COLUMN IF NOT EXISTS "code" varchar,
  ADD COLUMN IF NOT EXISTS "notes" text;

-- Add admin_notes column to hospital_change_requests
ALTER TABLE "hospital_change_requests"
  ADD COLUMN IF NOT EXISTS "admin_notes" text;

-- Add missing columns to hospital door codes
ALTER TABLE "hospital_change_requests_proposed_data_door_codes"
  ADD COLUMN IF NOT EXISTS "label" varchar,
  ADD COLUMN IF NOT EXISTS "code" varchar,
  ADD COLUMN IF NOT EXISTS "notes" text,
  ADD COLUMN IF NOT EXISTS "is_primary" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "color_theme" varchar;

-- Create hospital_change_requests_proposed_data_campus_maps table
CREATE TABLE IF NOT EXISTS "hospital_change_requests_proposed_data_campus_maps" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "label" varchar,
  "slug" varchar,
  "map_type" varchar,
  "description" text,
  "map_media_id" integer,
  "external_url" varchar
);

-- Add any missing columns to campus maps
ALTER TABLE "hospital_change_requests_proposed_data_campus_maps"
  ADD COLUMN IF NOT EXISTS "label" varchar,
  ADD COLUMN IF NOT EXISTS "slug" varchar,
  ADD COLUMN IF NOT EXISTS "map_type" varchar,
  ADD COLUMN IF NOT EXISTS "description" text,
  ADD COLUMN IF NOT EXISTS "map_media_id" integer,
  ADD COLUMN IF NOT EXISTS "external_url" varchar;

-- Create indexes for campus maps
CREATE INDEX IF NOT EXISTS "hospital_change_requests_proposed_data_campus_maps_order_idx"
  ON "hospital_change_requests_proposed_data_campus_maps" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "hospital_change_requests_proposed_data_campus_maps_parent_idx"
  ON "hospital_change_requests_proposed_data_campus_maps" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "hospital_change_requests_proposed_data_campus_maps_map_media_idx"
  ON "hospital_change_requests_proposed_data_campus_maps" USING btree ("map_media_id");

-- Add foreign keys for campus maps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hospital_change_requests_proposed_data_campus_maps_parent_fk'
  ) THEN
    ALTER TABLE "hospital_change_requests_proposed_data_campus_maps"
      ADD CONSTRAINT "hospital_change_requests_proposed_data_campus_maps_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "hospital_change_requests"("id")
        ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hospital_change_requests_proposed_data_campus_maps_map_media_fk'
  ) THEN
    ALTER TABLE "hospital_change_requests_proposed_data_campus_maps"
      ADD CONSTRAINT "hospital_change_requests_proposed_data_campus_maps_map_media_fk"
        FOREIGN KEY ("map_media_id") REFERENCES "media"("id")
        ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

-- Create hospital_change_requests_proposed_data_capabilities table
CREATE TABLE IF NOT EXISTS "hospital_change_requests_proposed_data_capabilities" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "capability_id" integer,
  "level" varchar
);

-- Add any missing columns to capabilities
ALTER TABLE "hospital_change_requests_proposed_data_capabilities"
  ADD COLUMN IF NOT EXISTS "capability_id" integer,
  ADD COLUMN IF NOT EXISTS "level" varchar;

-- Create indexes for capabilities
CREATE INDEX IF NOT EXISTS "hospital_change_requests_proposed_data_capabilities_order_idx"
  ON "hospital_change_requests_proposed_data_capabilities" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "hospital_change_requests_proposed_data_capabilities_parent_idx"
  ON "hospital_change_requests_proposed_data_capabilities" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "hospital_change_requests_proposed_data_capabilities_capability_idx"
  ON "hospital_change_requests_proposed_data_capabilities" USING btree ("capability_id");

-- Add foreign keys for capabilities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hospital_change_requests_proposed_data_capabilities_parent_fk'
  ) THEN
    ALTER TABLE "hospital_change_requests_proposed_data_capabilities"
      ADD CONSTRAINT "hospital_change_requests_proposed_data_capabilities_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "hospital_change_requests"("id")
        ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hospital_change_requests_proposed_data_capabilities_capability_fk'
  ) THEN
    ALTER TABLE "hospital_change_requests_proposed_data_capabilities"
      ADD CONSTRAINT "hospital_change_requests_proposed_data_capabilities_capability_fk"
        FOREIGN KEY ("capability_id") REFERENCES "hospital_capabilities"("id")
        ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

-- Add helipad group columns to hospital_change_requests if missing
ALTER TABLE "hospital_change_requests"
  ADD COLUMN IF NOT EXISTS "proposed_data_helipad_identifier" varchar,
  ADD COLUMN IF NOT EXISTS "proposed_data_helipad_night_operations" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "proposed_data_helipad_preferred_approach" varchar,
  ADD COLUMN IF NOT EXISTS "proposed_data_helipad_notes" text;

COMMIT;

-- ========================================
-- Verification
-- ========================================

SELECT 'Fixed payload_locked_documents_rels columns:' as status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payload_locked_documents_rels'
  AND column_name IN (
    'hospital_networks_id',
    'hospital_capabilities_id',
    'hospitals_id',
    'hospital_change_requests_id',
    'base_change_requests_id',
    'bases_id',
    'assets_id',
    'calculators_id'
  )
ORDER BY column_name;

SELECT 'Fixed base_change_requests columns:' as status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'base_change_requests'
  AND column_name = 'admin_notes';

SELECT 'Fixed hospital_change_requests columns:' as status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'hospital_change_requests'
  AND column_name LIKE '%admin_notes%' OR column_name LIKE '%helipad%'
ORDER BY column_name;
