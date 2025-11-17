import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add optional notes field to door code tables for bases and related change requests.
 *
 * Note: Change request door codes are nested under proposedData group, so table names
 * include "proposed_data" in the path.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add notes to main bases and hospitals door codes tables
    ALTER TABLE "bases_door_codes"
      ADD COLUMN IF NOT EXISTS "notes" text;

    ALTER TABLE "hospitals_door_codes"
      ADD COLUMN IF NOT EXISTS "notes" text;

    -- Add notes to change request door codes tables (only if they exist)
    -- These tables are nested under proposedData group
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'base_change_requests_proposed_data_door_codes'
      ) THEN
        ALTER TABLE "base_change_requests_proposed_data_door_codes"
          ADD COLUMN IF NOT EXISTS "notes" text;
      END IF;

      IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'hospital_change_requests_proposed_data_door_codes'
      ) THEN
        ALTER TABLE "hospital_change_requests_proposed_data_door_codes"
          ADD COLUMN IF NOT EXISTS "notes" text;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove notes from main tables
    ALTER TABLE "bases_door_codes"
      DROP COLUMN IF EXISTS "notes";

    ALTER TABLE "hospitals_door_codes"
      DROP COLUMN IF EXISTS "notes";

    -- Remove notes from change request tables (only if they exist)
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'base_change_requests_proposed_data_door_codes'
      ) THEN
        ALTER TABLE "base_change_requests_proposed_data_door_codes"
          DROP COLUMN IF EXISTS "notes";
      END IF;

      IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'hospital_change_requests_proposed_data_door_codes'
      ) THEN
        ALTER TABLE "hospital_change_requests_proposed_data_door_codes"
          DROP COLUMN IF EXISTS "notes";
      END IF;
    END $$;
  `)
}
