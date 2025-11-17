import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add optional notes field to door code tables for bases and related change requests.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bases_door_codes"
      ADD COLUMN IF NOT EXISTS "notes" varchar;

    ALTER TABLE "hospitals_door_codes"
      ADD COLUMN IF NOT EXISTS "notes" varchar;

    ALTER TABLE "base_change_requests_door_codes"
      ADD COLUMN IF NOT EXISTS "notes" varchar;

    ALTER TABLE "hospital_change_requests_door_codes"
      ADD COLUMN IF NOT EXISTS "notes" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bases_door_codes"
      DROP COLUMN IF EXISTS "notes";

    ALTER TABLE "hospitals_door_codes"
      DROP COLUMN IF EXISTS "notes";

    ALTER TABLE "base_change_requests_door_codes"
      DROP COLUMN IF EXISTS "notes";

    ALTER TABLE "hospital_change_requests_door_codes"
      DROP COLUMN IF EXISTS "notes";
  `)
}
