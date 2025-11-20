import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Add source attribution to hospital change requests
 *
 * Adds the missing proposed_data_source_attribution column to the
 * hospital_change_requests table to match the collection schema.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hospital_change_requests"
      ADD COLUMN IF NOT EXISTS "proposed_data_source_attribution" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hospital_change_requests"
      DROP COLUMN IF EXISTS "proposed_data_source_attribution";
  `)
}
