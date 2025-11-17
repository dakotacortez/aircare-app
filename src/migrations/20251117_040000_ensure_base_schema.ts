import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Ensure Base Schema Integrity
 *
 * This is a comprehensive fallback migration that ensures all base-related
 * tables and columns exist in the database. It uses "IF NOT EXISTS" and
 * "ADD COLUMN IF NOT EXISTS" to be idempotent and safe to run multiple times.
 *
 * Tables ensured:
 * - bases (main table with all columns)
 * - bases_contact_info (contact entries with label, phone_number, description)
 * - bases_door_codes (door code entries with label, code, notes)
 * - bases_hazards (hazard notes)
 * - bases_rels (relationship table for assets)
 *
 * This migration acts as a safety net to ensure schema consistency
 * even if previous migrations were partially run or auto-migrations failed.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Ensure bases table exists with all necessary columns
    CREATE TABLE IF NOT EXISTS "bases" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar,
      "network_id" integer,
      "network_logo_override_id" integer,
      "squad_phone" varchar,
      "coordinates" varchar,
      "latitude" numeric,
      "longitude" numeric,
      "notes" text,
      "source_attribution" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Add any missing columns to bases table
    ALTER TABLE "bases"
      ADD COLUMN IF NOT EXISTS "slug" varchar,
      ADD COLUMN IF NOT EXISTS "network_id" integer,
      ADD COLUMN IF NOT EXISTS "network_logo_override_id" integer,
      ADD COLUMN IF NOT EXISTS "squad_phone" varchar,
      ADD COLUMN IF NOT EXISTS "coordinates" varchar,
      ADD COLUMN IF NOT EXISTS "latitude" numeric,
      ADD COLUMN IF NOT EXISTS "longitude" numeric,
      ADD COLUMN IF NOT EXISTS "notes" text,
      ADD COLUMN IF NOT EXISTS "source_attribution" varchar;

    -- Ensure bases address group columns exist
    ALTER TABLE "bases"
      ADD COLUMN IF NOT EXISTS "address_line1" varchar,
      ADD COLUMN IF NOT EXISTS "address_line2" varchar,
      ADD COLUMN IF NOT EXISTS "address_city" varchar,
      ADD COLUMN IF NOT EXISTS "address_state" varchar,
      ADD COLUMN IF NOT EXISTS "address_zip" varchar;

    -- Ensure bases_contact_info table exists
    CREATE TABLE IF NOT EXISTS "bases_contact_info" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "phone_number" varchar,
      "description" text
    );

    -- Add description column if missing (from recent updates)
    ALTER TABLE "bases_contact_info"
      ADD COLUMN IF NOT EXISTS "description" text;

    -- Create indexes for bases_contact_info if they don't exist
    CREATE INDEX IF NOT EXISTS "bases_contact_info_order_idx"
      ON "bases_contact_info" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "bases_contact_info_parent_idx"
      ON "bases_contact_info" USING btree ("_parent_id");

    -- Add foreign key for bases_contact_info if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bases_contact_info_parent_fk'
      ) THEN
        ALTER TABLE "bases_contact_info"
          ADD CONSTRAINT "bases_contact_info_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "bases"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Ensure bases_door_codes table exists
    CREATE TABLE IF NOT EXISTS "bases_door_codes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "code" varchar,
      "notes" text
    );

    -- Add notes column if missing (from recent updates)
    ALTER TABLE "bases_door_codes"
      ADD COLUMN IF NOT EXISTS "notes" text;

    -- Create indexes for bases_door_codes if they don't exist
    CREATE INDEX IF NOT EXISTS "bases_door_codes_order_idx"
      ON "bases_door_codes" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "bases_door_codes_parent_idx"
      ON "bases_door_codes" USING btree ("_parent_id");

    -- Add foreign key for bases_door_codes if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bases_door_codes_parent_fk'
      ) THEN
        ALTER TABLE "bases_door_codes"
          ADD CONSTRAINT "bases_door_codes_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "bases"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Ensure bases_hazards table exists
    CREATE TABLE IF NOT EXISTS "bases_hazards" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "note" text
    );

    -- Create indexes for bases_hazards if they don't exist
    CREATE INDEX IF NOT EXISTS "bases_hazards_order_idx"
      ON "bases_hazards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "bases_hazards_parent_idx"
      ON "bases_hazards" USING btree ("_parent_id");

    -- Add foreign key for bases_hazards if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bases_hazards_parent_fk'
      ) THEN
        ALTER TABLE "bases_hazards"
          ADD CONSTRAINT "bases_hazards_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "bases"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Ensure bases_rels table exists (for assets relationship)
    CREATE TABLE IF NOT EXISTS "bases_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "assets_id" integer
    );

    -- Create indexes for bases_rels if they don't exist
    CREATE INDEX IF NOT EXISTS "bases_rels_order_idx"
      ON "bases_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "bases_rels_parent_idx"
      ON "bases_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "bases_rels_path_idx"
      ON "bases_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "bases_rels_assets_id_idx"
      ON "bases_rels" USING btree ("assets_id");

    -- Add foreign keys for bases_rels if they don't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bases_rels_parent_fk'
      ) THEN
        ALTER TABLE "bases_rels"
          ADD CONSTRAINT "bases_rels_parent_fk"
            FOREIGN KEY ("parent_id") REFERENCES "bases"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bases_rels_assets_fk'
      ) THEN
        ALTER TABLE "bases_rels"
          ADD CONSTRAINT "bases_rels_assets_fk"
            FOREIGN KEY ("assets_id") REFERENCES "assets"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Add indexes for bases main table foreign keys if they don't exist
    CREATE INDEX IF NOT EXISTS "bases_slug_idx"
      ON "bases" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "bases_network_idx"
      ON "bases" USING btree ("network_id");
    CREATE INDEX IF NOT EXISTS "bases_network_logo_override_idx"
      ON "bases" USING btree ("network_logo_override_id");
    CREATE INDEX IF NOT EXISTS "bases_updated_at_idx"
      ON "bases" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "bases_created_at_idx"
      ON "bases" USING btree ("created_at");

    -- Add foreign keys for bases if they don't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bases_network_fk'
      ) THEN
        ALTER TABLE "bases"
          ADD CONSTRAINT "bases_network_fk"
            FOREIGN KEY ("network_id") REFERENCES "hospital_networks"("id")
            ON DELETE set null ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bases_network_logo_override_fk'
      ) THEN
        ALTER TABLE "bases"
          ADD CONSTRAINT "bases_network_logo_override_fk"
            FOREIGN KEY ("network_logo_override_id") REFERENCES "media"("id")
            ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    -- Ensure unique constraint on slug
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bases_slug_unique'
      ) THEN
        ALTER TABLE "bases"
          ADD CONSTRAINT "bases_slug_unique" UNIQUE ("slug");
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
