import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Add missing columns to change request tables
 *
 * This migration adds columns that were added to the collection definitions
 * after the initial change request schema migration.
 *
 * Missing columns:
 * - base_change_requests.admin_notes
 * - hospital_change_requests.admin_notes
 * - hospital_change_requests_proposed_data_door_codes.is_primary
 * - hospital_change_requests_proposed_data_door_codes.color_theme
 * - base_change_requests_proposed_data_door_codes.label (ensure it exists)
 * - hospital_change_requests_proposed_data_campus_maps table (entire table)
 * - hospital_change_requests_proposed_data_capabilities table (entire table)
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ========================================
    -- BASE CHANGE REQUESTS
    -- ========================================

    -- Add admin_notes column to base_change_requests
    ALTER TABLE "base_change_requests"
      ADD COLUMN IF NOT EXISTS "admin_notes" text;

    -- Ensure door codes table has all columns
    ALTER TABLE "base_change_requests_proposed_data_door_codes"
      ADD COLUMN IF NOT EXISTS "label" varchar,
      ADD COLUMN IF NOT EXISTS "code" varchar,
      ADD COLUMN IF NOT EXISTS "notes" text;

    -- ========================================
    -- HOSPITAL CHANGE REQUESTS
    -- ========================================

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

    -- ========================================
    -- HOSPITAL CAMPUS MAPS
    -- ========================================

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

    -- Add any missing columns
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

    -- ========================================
    -- HOSPITAL CAPABILITIES
    -- ========================================

    -- Create hospital_change_requests_proposed_data_capabilities table
    CREATE TABLE IF NOT EXISTS "hospital_change_requests_proposed_data_capabilities" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "capability_id" integer,
      "level" varchar
    );

    -- Add any missing columns
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

    -- ========================================
    -- HOSPITAL HELIPAD FIELDS
    -- ========================================

    -- Add helipad group columns to hospital_change_requests if missing
    ALTER TABLE "hospital_change_requests"
      ADD COLUMN IF NOT EXISTS "proposed_data_helipad_identifier" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_helipad_night_operations" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "proposed_data_helipad_preferred_approach" varchar,
      ADD COLUMN IF NOT EXISTS "proposed_data_helipad_notes" text;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove helipad columns
    ALTER TABLE "hospital_change_requests"
      DROP COLUMN IF EXISTS "proposed_data_helipad_identifier",
      DROP COLUMN IF EXISTS "proposed_data_helipad_night_operations",
      DROP COLUMN IF EXISTS "proposed_data_helipad_preferred_approach",
      DROP COLUMN IF EXISTS "proposed_data_helipad_notes";

    -- Drop capabilities table and constraints
    DROP TABLE IF EXISTS "hospital_change_requests_proposed_data_capabilities" CASCADE;

    -- Drop campus maps table and constraints
    DROP TABLE IF EXISTS "hospital_change_requests_proposed_data_campus_maps" CASCADE;

    -- Remove door code columns
    ALTER TABLE "hospital_change_requests_proposed_data_door_codes"
      DROP COLUMN IF EXISTS "is_primary",
      DROP COLUMN IF EXISTS "color_theme";

    -- Remove admin_notes columns
    ALTER TABLE "hospital_change_requests"
      DROP COLUMN IF EXISTS "admin_notes";
    ALTER TABLE "base_change_requests"
      DROP COLUMN IF EXISTS "admin_notes";
  `)
}
