import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add role, approved, and status fields to users table
 *
 * This migration adds role-based access control to the users collection:
 * - role: 'user' | 'content-team' | 'admin-team'
 * - approved: boolean (requires Content Team or Admin approval)
 * - status: 'pending' | 'active' | 'inactive'
 *
 * Existing users will be migrated to 'admin-team' role with 'active' status
 * to ensure they maintain access to the system.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create enum types for role and status
    CREATE TYPE "public"."enum_users_role" AS ENUM('user', 'content-team', 'admin-team');
    CREATE TYPE "public"."enum_users_status" AS ENUM('pending', 'active', 'inactive');

    -- Add new columns to users table
    ALTER TABLE "users"
      ADD COLUMN "role" "enum_users_role" DEFAULT 'user' NOT NULL,
      ADD COLUMN "approved" boolean DEFAULT false NOT NULL,
      ADD COLUMN "status" "enum_users_status" DEFAULT 'pending' NOT NULL;

    -- Migrate existing users to admin-team with active status
    -- This ensures existing users don't lose access
    UPDATE "users"
    SET
      "role" = 'admin-team',
      "approved" = true,
      "status" = 'active'
    WHERE "id" IS NOT NULL;

    -- Create indexes for better query performance
    CREATE INDEX "users_role_idx" ON "users" USING btree ("role");
    CREATE INDEX "users_approved_idx" ON "users" USING btree ("approved");
    CREATE INDEX "users_status_idx" ON "users" USING btree ("status");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop indexes
    DROP INDEX IF EXISTS "users_role_idx";
    DROP INDEX IF EXISTS "users_approved_idx";
    DROP INDEX IF EXISTS "users_status_idx";

    -- Remove columns from users table
    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "role",
      DROP COLUMN IF EXISTS "approved",
      DROP COLUMN IF EXISTS "status";

    -- Drop enum types
    DROP TYPE IF EXISTS "public"."enum_users_role";
    DROP TYPE IF EXISTS "public"."enum_users_status";
  `)
}
