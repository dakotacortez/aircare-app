import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Re-add missing source attribution column for hospital change requests
 *
 * Some environments were missing the proposed_data_source_attribution column,
 * which is required by the HospitalChangeRequests collection schema. This
 * migration safely reintroduces the column if it is absent.
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
