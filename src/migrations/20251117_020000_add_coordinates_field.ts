import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Add coordinates text field for easier Google Maps paste
 * 
 * Adds a coordinates varchar field to both hospitals and bases tables.
 * The latitude and longitude number fields remain for backward compatibility.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hospitals"
      ADD COLUMN IF NOT EXISTS "coordinates" varchar;

    ALTER TABLE "bases"
      ADD COLUMN IF NOT EXISTS "coordinates" varchar;

    -- Populate coordinates field from existing lat/lng data
    UPDATE "hospitals"
      SET "coordinates" = CONCAT("latitude", ', ', "longitude")
      WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;

    UPDATE "bases"
      SET "coordinates" = CONCAT("latitude", ', ', "longitude")
      WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hospitals"
      DROP COLUMN IF EXISTS "coordinates";

    ALTER TABLE "bases"
      DROP COLUMN IF EXISTS "coordinates";
  `)
}
