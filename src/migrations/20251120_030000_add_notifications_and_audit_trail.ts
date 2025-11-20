import { sql, MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Add Notifications and Audit Trail System
 *
 * This migration adds:
 * 1. Notifications collection - tracks all email notifications sent by the system
 * 2. AuditLog collection - detailed change tracking for amendments and status changes
 * 3. Rejection reason fields - allows admins to provide feedback when rejecting requests
 * 4. FCM tokens - for push notifications (Android/iOS)
 * 5. Notification preferences - per-user email notification settings
 *
 * Collections affected:
 * - users (new: rejection_reason, fcmTokens array, notificationPreferences group)
 * - hospital_change_requests (new: rejection_reason)
 * - base_change_requests (new: rejection_reason)
 * - notifications (new table)
 * - audit_log (new table)
 * - users_fcm_tokens (new table for FCM token array)
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
    -- USER FIELDS - REJECTION REASONS
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

    -- ========================================
    -- USER FIELDS - NOTIFICATION PREFERENCES
    -- ========================================

    -- Add notification preference fields to users table
    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "notification_preferences_user_registrations" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "notification_preferences_change_requests" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "notification_preferences_system_notifications" boolean DEFAULT true;

    -- ========================================
    -- USER FIELDS - FCM TOKENS (Push Notifications)
    -- ========================================

    -- Create users_fcm_tokens table for push notification device tokens
    CREATE TABLE IF NOT EXISTS "users_fcm_tokens" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "token" varchar NOT NULL,
      "platform" varchar,
      "last_used" timestamp(3) with time zone
    );

    -- Create indexes for fcm_tokens
    CREATE INDEX IF NOT EXISTS "users_fcm_tokens_order_idx" ON "users_fcm_tokens" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "users_fcm_tokens_parent_idx" ON "users_fcm_tokens" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "users_fcm_tokens_token_idx" ON "users_fcm_tokens" USING btree ("token");

    -- Add foreign key for fcm_tokens
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_fcm_tokens_parent_fk'
      ) THEN
        ALTER TABLE "users_fcm_tokens"
          ADD CONSTRAINT "users_fcm_tokens_parent_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "users"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop FCM tokens table
    DROP TABLE IF EXISTS "users_fcm_tokens" CASCADE;

    -- Remove notification preference columns
    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "notification_preferences_user_registrations",
      DROP COLUMN IF EXISTS "notification_preferences_change_requests",
      DROP COLUMN IF EXISTS "notification_preferences_system_notifications";

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
