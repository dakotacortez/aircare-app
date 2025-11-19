import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add missing metadata fields to site_settings
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "meta_site_name" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "meta_twitter_handle" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove metadata fields from site_settings
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "meta_site_name";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "meta_twitter_handle";
  `);
}
