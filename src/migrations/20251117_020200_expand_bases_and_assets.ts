import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Expand bases and assets schema
 * 
 * Adds fields to Bases:
 * - network relationship (like hospitals)
 * - networkLogoOverride
 * - squadPhone
 * - description field to contactInfo
 * - hazards array
 * - sourceAttribution
 * 
 * Adds fields to Assets:
 * - emoji
 * - unitId
 * - licensePlate
 * - capabilities (detailed description for tooltips)
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add new fields to bases table
    ALTER TABLE "bases"
      ADD COLUMN IF NOT EXISTS "network_id" integer,
      ADD COLUMN IF NOT EXISTS "network_logo_override_id" integer,
      ADD COLUMN IF NOT EXISTS "squad_phone" varchar,
      ADD COLUMN IF NOT EXISTS "source_attribution" varchar;

    -- Add description to bases contactInfo
    ALTER TABLE "bases_contact_info"
      ADD COLUMN IF NOT EXISTS "description" text;

    -- Create bases hazards table
    CREATE TABLE IF NOT EXISTS "bases_hazards" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "note" text
    );

    CREATE INDEX IF NOT EXISTS "bases_hazards_order_idx"
      ON "bases_hazards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "bases_hazards_parent_idx"
      ON "bases_hazards" USING btree ("_parent_id");

    ALTER TABLE "bases_hazards"
      ADD CONSTRAINT "bases_hazards_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "bases"("id")
        ON DELETE cascade ON UPDATE no action;

    -- Add foreign keys for bases network relationship
    CREATE INDEX IF NOT EXISTS "bases_network_idx"
      ON "bases" USING btree ("network_id");
    CREATE INDEX IF NOT EXISTS "bases_network_logo_override_idx"
      ON "bases" USING btree ("network_logo_override_id");

    ALTER TABLE "bases"
      ADD CONSTRAINT "bases_network_fk"
        FOREIGN KEY ("network_id") REFERENCES "hospital_networks"("id")
        ON DELETE set null ON UPDATE no action;

    ALTER TABLE "bases"
      ADD CONSTRAINT "bases_network_logo_override_fk"
        FOREIGN KEY ("network_logo_override_id") REFERENCES "media"("id")
        ON DELETE set null ON UPDATE no action;

    -- Add new fields to assets table
    ALTER TABLE "assets"
      ADD COLUMN IF NOT EXISTS "emoji" varchar,
      ADD COLUMN IF NOT EXISTS "unit_id" varchar,
      ADD COLUMN IF NOT EXISTS "license_plate" varchar,
      ADD COLUMN IF NOT EXISTS "capabilities" text;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop bases foreign keys first
    ALTER TABLE "bases"
      DROP CONSTRAINT IF EXISTS "bases_network_fk",
      DROP CONSTRAINT IF EXISTS "bases_network_logo_override_fk";

    DROP INDEX IF EXISTS "bases_network_idx";
    DROP INDEX IF EXISTS "bases_network_logo_override_idx";

    -- Drop bases columns
    ALTER TABLE "bases"
      DROP COLUMN IF EXISTS "network_id",
      DROP COLUMN IF EXISTS "network_logo_override_id",
      DROP COLUMN IF EXISTS "squad_phone",
      DROP COLUMN IF EXISTS "source_attribution";

    -- Drop contactInfo description
    ALTER TABLE "bases_contact_info"
      DROP COLUMN IF EXISTS "description";

    -- Drop hazards table
    DROP TABLE IF EXISTS "bases_hazards" CASCADE;
    DROP INDEX IF EXISTS "bases_hazards_order_idx";
    DROP INDEX IF EXISTS "bases_hazards_parent_idx";

    -- Drop assets columns
    ALTER TABLE "assets"
      DROP COLUMN IF EXISTS "emoji",
      DROP COLUMN IF EXISTS "unit_id",
      DROP COLUMN IF EXISTS "license_plate",
      DROP COLUMN IF EXISTS "capabilities";
  `)
}
