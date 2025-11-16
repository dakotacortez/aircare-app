import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add profile_image_id field to users table
 *
 * This migration adds the profile image upload field to the users collection:
 * - profile_image_id: integer (references media collection)
 *
 * Existing users will have no profile image by default (null).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add profile_image_id column to users table
    ALTER TABLE "users"
      ADD COLUMN "profile_image_id" integer;

    -- Add foreign key constraint to media collection
    ALTER TABLE "users"
      ADD CONSTRAINT "users_profile_image_id_media_id_fk"
      FOREIGN KEY ("profile_image_id")
      REFERENCES "media"("id")
      ON DELETE set null
      ON UPDATE no action;

    -- Create index for better query performance
    CREATE INDEX "users_profile_image_id_idx" ON "users" USING btree ("profile_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop index
    DROP INDEX IF EXISTS "users_profile_image_id_idx";

    -- Drop foreign key constraint
    ALTER TABLE "users"
      DROP CONSTRAINT IF EXISTS "users_profile_image_id_media_id_fk";

    -- Remove column from users table
    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "profile_image_id";
  `)
}
