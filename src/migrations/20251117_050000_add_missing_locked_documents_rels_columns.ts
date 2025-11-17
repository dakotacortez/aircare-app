import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Add missing columns to payload_locked_documents_rels
 *
 * The payload_locked_documents_rels table stores relationships for the locked documents
 * feature. When new collections are added to the system, corresponding ID columns need
 * to be added to this table to support relationships to those collections.
 *
 * This migration adds missing columns for:
 * - hospital_networks_id
 * - hospital_capabilities_id
 * - hospitals_id
 * - hospital_change_requests_id
 * - base_change_requests_id
 * - bases_id
 * - assets_id
 * - calculators_id
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
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
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove foreign key constraints
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_hospital_networks_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_hospital_capabilities_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_hospitals_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_hospital_change_requests_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_base_change_requests_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_bases_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_assets_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_calculators_fk";

    -- Drop indexes
    DROP INDEX IF EXISTS "payload_locked_documents_rels_hospital_networks_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_hospital_capabilities_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_hospitals_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_hospital_change_requests_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_base_change_requests_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_bases_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_assets_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_calculators_id_idx";

    -- Drop columns
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "hospital_networks_id",
      DROP COLUMN IF EXISTS "hospital_capabilities_id",
      DROP COLUMN IF EXISTS "hospitals_id",
      DROP COLUMN IF EXISTS "hospital_change_requests_id",
      DROP COLUMN IF EXISTS "base_change_requests_id",
      DROP COLUMN IF EXISTS "bases_id",
      DROP COLUMN IF EXISTS "assets_id",
      DROP COLUMN IF EXISTS "calculators_id";
  `)
}
