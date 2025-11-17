import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Ensure Hospital Schema Integrity
 *
 * This is a comprehensive fallback migration that ensures all hospital-related
 * tables and columns exist in the database. It uses "IF NOT EXISTS" and
 * "ADD COLUMN IF NOT EXISTS" to be idempotent and safe to run multiple times.
 *
 * Tables ensured:
 * - hospitals (main table with all columns)
 * - hospitals_contact_info (contact entries with label, phone_number, description)
 * - hospitals_door_codes (door code entries with label, code, notes)
 * - hospitals_hazards (hazard notes)
 * - hospitals_rels (relationship table for capabilities and network)
 *
 * This migration acts as a safety net to ensure schema consistency
 * even if previous migrations were partially run or auto-migrations failed.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Ensure hospitals table exists with all necessary columns
    CREATE TABLE IF NOT EXISTS "hospitals" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar,
      "coordinates" varchar,
      "latitude" numeric,
      "longitude" numeric,
      "primary_phone" varchar,
      "emergency_phone" varchar,
      "radiology_phone" varchar,
      "charge_nurse_phone" varchar,
      "trauma_level" varchar,
      "burn_level" varchar,
      "stroke_level" varchar,
      "stemi_level" varchar,
      "pediatric_level" varchar,
      "bed_count" integer,
      "helipad" boolean DEFAULT false,
      "er_diversion_info" text,
      "notes" text,
      "source_attribution" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Add any missing columns to hospitals table
    ALTER TABLE "hospitals"
      ADD COLUMN IF NOT EXISTS "slug" varchar,
      ADD COLUMN IF NOT EXISTS "coordinates" varchar,
      ADD COLUMN IF NOT EXISTS "latitude" numeric,
      ADD COLUMN IF NOT EXISTS "longitude" numeric,
      ADD COLUMN IF NOT EXISTS "primary_phone" varchar,
      ADD COLUMN IF NOT EXISTS "emergency_phone" varchar,
      ADD COLUMN IF NOT EXISTS "radiology_phone" varchar,
      ADD COLUMN IF NOT EXISTS "charge_nurse_phone" varchar,
      ADD COLUMN IF NOT EXISTS "trauma_level" varchar,
      ADD COLUMN IF NOT EXISTS "burn_level" varchar,
      ADD COLUMN IF NOT EXISTS "stroke_level" varchar,
      ADD COLUMN IF NOT EXISTS "stemi_level" varchar,
      ADD COLUMN IF NOT EXISTS "pediatric_level" varchar,
      ADD COLUMN IF NOT EXISTS "bed_count" integer,
      ADD COLUMN IF NOT EXISTS "helipad" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "er_diversion_info" text,
      ADD COLUMN IF NOT EXISTS "notes" text,
      ADD COLUMN IF NOT EXISTS "source_attribution" varchar;

    -- Ensure hospitals address group columns exist
    ALTER TABLE "hospitals"
      ADD COLUMN IF NOT EXISTS "address_line1" varchar,
      ADD COLUMN IF NOT EXISTS "address_line2" varchar,
      ADD COLUMN IF NOT EXISTS "address_city" varchar,
      ADD COLUMN IF NOT EXISTS "address_state" varchar,
      ADD COLUMN IF NOT EXISTS "address_zip" varchar;

    -- Ensure hospitals_contact_info table exists
    CREATE TABLE IF NOT EXISTS "hospitals_contact_info" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "phone_number" varchar,
      "description" text
    );

    -- Add description column if missing
    ALTER TABLE "hospitals_contact_info"
      ADD COLUMN IF NOT EXISTS "description" text;

    -- Create indexes for hospitals_contact_info if they don't exist
    CREATE INDEX IF NOT EXISTS "hospitals_contact_info_order_idx"
      ON "hospitals_contact_info" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "hospitals_contact_info_parent_idx"
      ON "hospitals_contact_info" USING btree ("_parent_id");

    -- Add foreign key for hospitals_contact_info if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospitals_contact_info_parent_fk'
      ) THEN
        ALTER TABLE "hospitals_contact_info"
          ADD CONSTRAINT "hospitals_contact_info_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "hospitals"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Ensure hospitals_door_codes table exists
    CREATE TABLE IF NOT EXISTS "hospitals_door_codes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "code" varchar,
      "notes" text
    );

    -- Add notes column if missing
    ALTER TABLE "hospitals_door_codes"
      ADD COLUMN IF NOT EXISTS "notes" text;

    -- Create indexes for hospitals_door_codes if they don't exist
    CREATE INDEX IF NOT EXISTS "hospitals_door_codes_order_idx"
      ON "hospitals_door_codes" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "hospitals_door_codes_parent_idx"
      ON "hospitals_door_codes" USING btree ("_parent_id");

    -- Add foreign key for hospitals_door_codes if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospitals_door_codes_parent_fk'
      ) THEN
        ALTER TABLE "hospitals_door_codes"
          ADD CONSTRAINT "hospitals_door_codes_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "hospitals"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Ensure hospitals_hazards table exists
    CREATE TABLE IF NOT EXISTS "hospitals_hazards" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "note" text
    );

    -- Create indexes for hospitals_hazards if they don't exist
    CREATE INDEX IF NOT EXISTS "hospitals_hazards_order_idx"
      ON "hospitals_hazards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "hospitals_hazards_parent_idx"
      ON "hospitals_hazards" USING btree ("_parent_id");

    -- Add foreign key for hospitals_hazards if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospitals_hazards_parent_fk'
      ) THEN
        ALTER TABLE "hospitals_hazards"
          ADD CONSTRAINT "hospitals_hazards_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "hospitals"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Ensure hospitals_rels table exists
    CREATE TABLE IF NOT EXISTS "hospitals_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "hospital_capabilities_id" integer,
      "hospital_networks_id" integer
    );

    -- Create indexes for hospitals_rels if they don't exist
    CREATE INDEX IF NOT EXISTS "hospitals_rels_order_idx"
      ON "hospitals_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "hospitals_rels_parent_idx"
      ON "hospitals_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "hospitals_rels_path_idx"
      ON "hospitals_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "hospitals_rels_hospital_capabilities_id_idx"
      ON "hospitals_rels" USING btree ("hospital_capabilities_id");
    CREATE INDEX IF NOT EXISTS "hospitals_rels_hospital_networks_id_idx"
      ON "hospitals_rels" USING btree ("hospital_networks_id");

    -- Add foreign keys for hospitals_rels if they don't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospitals_rels_parent_fk'
      ) THEN
        ALTER TABLE "hospitals_rels"
          ADD CONSTRAINT "hospitals_rels_parent_fk"
            FOREIGN KEY ("parent_id") REFERENCES "hospitals"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospitals_rels_hospital_capabilities_fk'
      ) THEN
        ALTER TABLE "hospitals_rels"
          ADD CONSTRAINT "hospitals_rels_hospital_capabilities_fk"
            FOREIGN KEY ("hospital_capabilities_id") REFERENCES "hospital_capabilities"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospitals_rels_hospital_networks_fk'
      ) THEN
        ALTER TABLE "hospitals_rels"
          ADD CONSTRAINT "hospitals_rels_hospital_networks_fk"
            FOREIGN KEY ("hospital_networks_id") REFERENCES "hospital_networks"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Add indexes for hospitals main table if they don't exist
    CREATE INDEX IF NOT EXISTS "hospitals_slug_idx"
      ON "hospitals" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "hospitals_updated_at_idx"
      ON "hospitals" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "hospitals_created_at_idx"
      ON "hospitals" USING btree ("created_at");

    -- Ensure unique constraint on slug
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospitals_slug_unique'
      ) THEN
        ALTER TABLE "hospitals"
          ADD CONSTRAINT "hospitals_slug_unique" UNIQUE ("slug");
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // This is a safety migration, so down migration is minimal
  // We don't want to drop tables that might have been created by other migrations
  await db.execute(sql`
    -- This migration is designed to be a safety net
    -- Down migration intentionally does nothing to avoid data loss
    SELECT 1;
  `)
}
