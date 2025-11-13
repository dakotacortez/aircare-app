import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add gradient configuration fields to site_settings
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "hero_gradient_top_opacity" numeric DEFAULT 60;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "hero_gradient_mid_opacity" numeric DEFAULT 80;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "hero_gradient_bottom_opacity" numeric DEFAULT 100;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "hero_gradient_color" varchar DEFAULT 'black';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove gradient configuration fields from site_settings
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "hero_gradient_top_opacity";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "hero_gradient_mid_opacity";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "hero_gradient_bottom_opacity";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "hero_gradient_color";
  `);
}
