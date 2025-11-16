import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add missing 'label' column to door_codes tables
 *
 * The Payload collection configs for Hospitals and Bases include a 'label'
 * field in their doorCodes arrays, but the database tables are missing this column.
 * This migration adds the label column to both tables.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add label column to hospitals_door_codes if it doesn't exist
    ALTER TABLE "hospitals_door_codes"
      ADD COLUMN IF NOT EXISTS "label" varchar;

    -- Add label column to bases_door_codes if it doesn't exist
    ALTER TABLE "bases_door_codes"
      ADD COLUMN IF NOT EXISTS "label" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove label column from hospitals_door_codes
    ALTER TABLE "hospitals_door_codes"
      DROP COLUMN IF EXISTS "label";

    -- Remove label column from bases_door_codes
    ALTER TABLE "bases_door_codes"
      DROP COLUMN IF EXISTS "label";
  `)
}
