import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Ensure route scope rows auto-generate IDs
 *
 * The medications_medication_indications_routes_scope table backs a hasMany select
 * inside the nested medication indications > routes array. Payload does not send an
 * explicit "id" for these rows, so the column must default to a generated UUID.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    ALTER TABLE IF EXISTS "medications_medication_indications_routes_scope"
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "medications_medication_indications_routes_scope"
      ALTER COLUMN "id" DROP DEFAULT;
  `)
}

