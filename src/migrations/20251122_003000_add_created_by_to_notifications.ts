import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add created_by_id column to notifications table
    ALTER TABLE "notifications"
    ADD COLUMN IF NOT EXISTS "created_by_id" integer;

    -- Add foreign key constraint
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'notifications_created_by_id_users_id_fk'
      ) THEN
        ALTER TABLE "notifications"
        ADD CONSTRAINT "notifications_created_by_id_users_id_fk"
        FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
      END IF;
    END$$;

    -- Add index for created_by_id
    CREATE INDEX IF NOT EXISTS "notifications_created_by_idx"
    ON "notifications" USING btree ("created_by_id");

    -- Add created_by_id column to push_notifications table
    ALTER TABLE "push_notifications"
    ADD COLUMN IF NOT EXISTS "created_by_id" integer;

    -- Add foreign key constraint
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'push_notifications_created_by_id_users_id_fk'
      ) THEN
        ALTER TABLE "push_notifications"
        ADD CONSTRAINT "push_notifications_created_by_id_users_id_fk"
        FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
      END IF;
    END$$;

    -- Add index for created_by_id
    CREATE INDEX IF NOT EXISTS "push_notifications_created_by_idx"
    ON "push_notifications" USING btree ("created_by_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove notifications created_by_id
    DROP INDEX IF EXISTS "notifications_created_by_idx";
    ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_created_by_id_users_id_fk";
    ALTER TABLE "notifications" DROP COLUMN IF EXISTS "created_by_id";

    -- Remove push_notifications created_by_id
    DROP INDEX IF EXISTS "push_notifications_created_by_idx";
    ALTER TABLE "push_notifications" DROP CONSTRAINT IF EXISTS "push_notifications_created_by_id_users_id_fk";
    ALTER TABLE "push_notifications" DROP COLUMN IF EXISTS "created_by_id";
  `)
}
