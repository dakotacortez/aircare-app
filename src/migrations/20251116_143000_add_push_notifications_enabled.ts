import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add push_notifications_enabled field to users table
 *
 * This migration adds the push notifications preference field to the users collection:
 * - push_notifications_enabled: boolean (default: false)
 *
 * Existing users will have push notifications disabled by default.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add push_notifications_enabled column to users table
    ALTER TABLE "users"
      ADD COLUMN "push_notifications_enabled" boolean DEFAULT false NOT NULL;

    -- Create index for better query performance
    CREATE INDEX "users_push_notifications_enabled_idx" ON "users" USING btree ("push_notifications_enabled");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop index
    DROP INDEX IF EXISTS "users_push_notifications_enabled_idx";

    -- Remove column from users table
    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "push_notifications_enabled";
  `)
}
