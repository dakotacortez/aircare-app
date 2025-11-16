import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: expand hospital schema to support the new info card layout.
 *
 * Adds helipad fields, campus map & hazard tables, richer contact metadata,
 * and door code styling metadata.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hospitals"
      ADD COLUMN IF NOT EXISTS "helipad_identifier" varchar,
      ADD COLUMN IF NOT EXISTS "helipad_night_operations" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "helipad_preferred_approach" varchar,
      ADD COLUMN IF NOT EXISTS "helipad_notes" text,
      ADD COLUMN IF NOT EXISTS "source_attribution" varchar;

    ALTER TABLE "hospitals_other_phones"
      ADD COLUMN IF NOT EXISTS "description" text;

    ALTER TABLE "hospitals_door_codes"
      ADD COLUMN IF NOT EXISTS "notes" text,
      ADD COLUMN IF NOT EXISTS "is_primary" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "color_theme" varchar;

    CREATE TABLE IF NOT EXISTS "hospitals_hazards" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "note" text
    );

    CREATE INDEX IF NOT EXISTS "hospitals_hazards_order_idx"
      ON "hospitals_hazards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "hospitals_hazards_parent_idx"
      ON "hospitals_hazards" USING btree ("_parent_id");

    ALTER TABLE "hospitals_hazards"
      ADD CONSTRAINT "hospitals_hazards_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "hospitals"("id")
        ON DELETE cascade ON UPDATE no action;

    CREATE TABLE IF NOT EXISTS "hospitals_campus_maps" (
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

    CREATE INDEX IF NOT EXISTS "hospitals_campus_maps_order_idx"
      ON "hospitals_campus_maps" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "hospitals_campus_maps_parent_idx"
      ON "hospitals_campus_maps" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "hospitals_campus_maps_media_idx"
      ON "hospitals_campus_maps" USING btree ("map_media_id");

    ALTER TABLE "hospitals_campus_maps"
      ADD CONSTRAINT "hospitals_campus_maps_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "hospitals"("id")
        ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "hospitals_campus_maps"
      ADD CONSTRAINT "hospitals_campus_maps_media_fk"
        FOREIGN KEY ("map_media_id") REFERENCES "media"("id")
        ON DELETE set null ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hospitals"
      DROP COLUMN IF EXISTS "helipad_identifier",
      DROP COLUMN IF EXISTS "helipad_night_operations",
      DROP COLUMN IF EXISTS "helipad_preferred_approach",
      DROP COLUMN IF EXISTS "helipad_notes",
      DROP COLUMN IF EXISTS "source_attribution";

    ALTER TABLE "hospitals_other_phones"
      DROP COLUMN IF EXISTS "description";

    ALTER TABLE "hospitals_door_codes"
      DROP COLUMN IF EXISTS "notes",
      DROP COLUMN IF EXISTS "is_primary",
      DROP COLUMN IF EXISTS "color_theme";

    DROP TABLE IF EXISTS "hospitals_hazards" CASCADE;
    DROP TABLE IF EXISTS "hospitals_campus_maps" CASCADE;

    DROP INDEX IF EXISTS "hospitals_hazards_order_idx";
    DROP INDEX IF EXISTS "hospitals_hazards_parent_idx";
    DROP INDEX IF EXISTS "hospitals_campus_maps_order_idx";
    DROP INDEX IF EXISTS "hospitals_campus_maps_parent_idx";
    DROP INDEX IF EXISTS "hospitals_campus_maps_media_idx";
  `)
}
