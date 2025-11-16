import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: ensure the `hospital_capabilities_levels` table includes the
 * optional `description` column that matches the Payload collection schema.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hospital_capabilities_levels"
      ADD COLUMN IF NOT EXISTS "description" text;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hospital_capabilities_levels"
      DROP COLUMN IF EXISTS "description";
  `)
}
