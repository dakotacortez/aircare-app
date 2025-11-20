import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Add Notifications and Audit Trail System
 *
 * This migration adds:
 * 1. Notifications collection - tracks all email notifications sent by the system
 * 2. AuditLog collection - detailed change tracking for amendments and status changes
 * 3. Rejection reason fields - allows admins to provide feedback when rejecting requests
 *
 * Collections affected:
 * - users (new: rejection_reason)
 * - hospital_change_requests (new: rejection_reason)
 * - base_change_requests (new: rejection_reason)
 * - notifications (new table)
 * - audit_log (new table)
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ========================================
    -- NOTIFICATIONS COLLECTION
    -- ========================================

    -- Create notifications table
    CREATE TABLE IF NOT EXISTS "notifications" (
      "id" serial PRIMARY KEY NOT NULL,
      "type" varchar NOT NULL,
      "recipient" varchar NOT NULL,
      "recipient_user_id" integer,
      "subject" varchar NOT NULL,
      "html_content" text,
      "status" varchar DEFAULT 'pending' NOT NULL,
      "email_id" varchar,
      "error" text,
      "related_user_id" integer,
      "related_hospital_request_id" integer,
      "related_base_request_id" integer,
      "sent_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Create indexes for notifications
    CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" USING btree ("type");
    CREATE INDEX IF NOT EXISTS "notifications_recipient_idx" ON "notifications" USING btree ("recipient");
    CREATE INDEX IF NOT EXISTS "notifications_status_idx" ON "notifications" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "notifications_recipient_user_idx" ON "notifications" USING btree ("recipient_user_id");
    CREATE INDEX IF NOT EXISTS "notifications_related_user_idx" ON "notifications" USING btree ("related_user_id");
    CREATE INDEX IF NOT EXISTS "notifications_related_hospital_request_idx" ON "notifications" USING btree ("related_hospital_request_id");
    CREATE INDEX IF NOT EXISTS "notifications_related_base_request_idx" ON "notifications" USING btree ("related_base_request_id");
    CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" USING btree ("created_at");

    -- Add foreign keys for notifications
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_recipient_user_fk'
      ) THEN
        ALTER TABLE "notifications"
          ADD CONSTRAINT "notifications_recipient_user_fk"
            FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id")
            ON DELETE set null ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_related_user_fk'
      ) THEN
        ALTER TABLE "notifications"
          ADD CONSTRAINT "notifications_related_user_fk"
            FOREIGN KEY ("related_user_id") REFERENCES "users"("id")
            ON DELETE set null ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_related_hospital_request_fk'
      ) THEN
        ALTER TABLE "notifications"
          ADD CONSTRAINT "notifications_related_hospital_request_fk"
            FOREIGN KEY ("related_hospital_request_id") REFERENCES "hospital_change_requests"("id")
            ON DELETE set null ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_related_base_request_fk'
      ) THEN
        ALTER TABLE "notifications"
          ADD CONSTRAINT "notifications_related_base_request_fk"
            FOREIGN KEY ("related_base_request_id") REFERENCES "base_change_requests"("id")
            ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    -- ========================================
    -- AUDIT LOG COLLECTION
    -- ========================================

    -- Create audit_log table
    CREATE TABLE IF NOT EXISTS "audit_log" (
      "id" serial PRIMARY KEY NOT NULL,
      "action" varchar NOT NULL,
      "collection" varchar NOT NULL,
      "document_id" varchar NOT NULL,
      "changed_by_id" integer NOT NULL,
      "metadata" jsonb,
      "ip_address" varchar,
      "user_agent" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Create audit_log_changes table (for field-level change tracking)
    CREATE TABLE IF NOT EXISTS "audit_log_changes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "field" varchar,
      "previous_value" text,
      "new_value" text
    );

    -- Create indexes for audit_log
    CREATE INDEX IF NOT EXISTS "audit_log_action_idx" ON "audit_log" USING btree ("action");
    CREATE INDEX IF NOT EXISTS "audit_log_collection_idx" ON "audit_log" USING btree ("collection");
    CREATE INDEX IF NOT EXISTS "audit_log_document_id_idx" ON "audit_log" USING btree ("document_id");
    CREATE INDEX IF NOT EXISTS "audit_log_changed_by_idx" ON "audit_log" USING btree ("changed_by_id");
    CREATE INDEX IF NOT EXISTS "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");

    -- Create indexes for audit_log_changes
    CREATE INDEX IF NOT EXISTS "audit_log_changes_order_idx" ON "audit_log_changes" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "audit_log_changes_parent_idx" ON "audit_log_changes" USING btree ("_parent_id");

    -- Add foreign keys for audit_log
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'audit_log_changed_by_fk'
      ) THEN
        ALTER TABLE "audit_log"
          ADD CONSTRAINT "audit_log_changed_by_fk"
            FOREIGN KEY ("changed_by_id") REFERENCES "users"("id")
            ON DELETE set null ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'audit_log_changes_parent_fk'
      ) THEN
        ALTER TABLE "audit_log_changes"
          ADD CONSTRAINT "audit_log_changes_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "audit_log"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- ========================================
    -- REJECTION REASON FIELDS
    -- ========================================

    -- Add rejection_reason to users table
    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "rejection_reason" text;

    -- Add rejection_reason to hospital_change_requests table
    ALTER TABLE "hospital_change_requests"
      ADD COLUMN IF NOT EXISTS "rejection_reason" text;

    -- Add rejection_reason to base_change_requests table
    ALTER TABLE "base_change_requests"
      ADD COLUMN IF NOT EXISTS "rejection_reason" text;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove rejection_reason columns
    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "rejection_reason";
    ALTER TABLE "hospital_change_requests"
      DROP COLUMN IF EXISTS "rejection_reason";
    ALTER TABLE "base_change_requests"
      DROP COLUMN IF EXISTS "rejection_reason";

    -- Drop audit_log tables
    DROP TABLE IF EXISTS "audit_log_changes" CASCADE;
    DROP TABLE IF EXISTS "audit_log" CASCADE;

    -- Drop notifications table
    DROP TABLE IF EXISTS "notifications" CASCADE;
  `)
}
