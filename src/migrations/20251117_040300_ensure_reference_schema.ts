import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Ensure reference collection schemas exist
 *
 * Adds safety nets for supporting collections used by other migrations and
 * relationships (hospital capabilities, levels, and networks). The statements
 * are idempotent and safe to run multiple times.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ========================================
    -- HOSPITAL CAPABILITIES
    -- ========================================
    CREATE TABLE IF NOT EXISTS "hospital_capabilities" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "category" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "hospital_capabilities"
      ADD COLUMN IF NOT EXISTS "name" varchar,
      ADD COLUMN IF NOT EXISTS "category" varchar,
      ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone DEFAULT now();

    CREATE INDEX IF NOT EXISTS "hospital_capabilities_category_idx"
      ON "hospital_capabilities" USING btree ("category");
    CREATE INDEX IF NOT EXISTS "hospital_capabilities_updated_at_idx"
      ON "hospital_capabilities" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "hospital_capabilities_created_at_idx"
      ON "hospital_capabilities" USING btree ("created_at");

    -- ========================================
    -- HOSPITAL CAPABILITY LEVELS (array field)
    -- ========================================
    CREATE TABLE IF NOT EXISTS "hospital_capabilities_levels" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "level" varchar,
      "description" text
    );

    ALTER TABLE "hospital_capabilities_levels"
      ADD COLUMN IF NOT EXISTS "level" varchar,
      ADD COLUMN IF NOT EXISTS "description" text;

    CREATE INDEX IF NOT EXISTS "hospital_capabilities_levels_order_idx"
      ON "hospital_capabilities_levels" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "hospital_capabilities_levels_parent_idx"
      ON "hospital_capabilities_levels" USING btree ("_parent_id");

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospital_capabilities_levels_parent_fk'
      ) THEN
        ALTER TABLE "hospital_capabilities_levels"
          ADD CONSTRAINT "hospital_capabilities_levels_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "hospital_capabilities"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- ========================================
    -- HOSPITAL NETWORKS
    -- ========================================
    CREATE TABLE IF NOT EXISTS "hospital_networks" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "logo_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "hospital_networks"
      ADD COLUMN IF NOT EXISTS "name" varchar,
      ADD COLUMN IF NOT EXISTS "logo_id" integer,
      ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone DEFAULT now();

    CREATE INDEX IF NOT EXISTS "hospital_networks_logo_idx"
      ON "hospital_networks" USING btree ("logo_id");
    CREATE INDEX IF NOT EXISTS "hospital_networks_updated_at_idx"
      ON "hospital_networks" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "hospital_networks_created_at_idx"
      ON "hospital_networks" USING btree ("created_at");

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hospital_networks_logo_fk'
      ) THEN
        ALTER TABLE "hospital_networks"
          ADD CONSTRAINT "hospital_networks_logo_fk"
            FOREIGN KEY ("logo_id") REFERENCES "media"("id")
            ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Safety migration: avoid dropping reference tables or constraints
  await db.execute(sql`
    SELECT 1;
  `)
}
