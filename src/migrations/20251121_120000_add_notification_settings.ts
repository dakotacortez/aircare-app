import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add notification settings system
 *
 * This migration:
 * 1. Creates notification_settings table for role-based notification preferences
 * 2. Creates push_notifications table for admin-sent push notifications
 * 3. Adds emailNotificationsEnabled field to users table
 * 4. Seeds initial notification settings with sensible defaults
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Create notification_settings table
  await payload.db.drizzle.execute(sql`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id SERIAL PRIMARY KEY,
      notification_type VARCHAR NOT NULL UNIQUE,
      admin_notifications_push_enabled BOOLEAN DEFAULT true,
      admin_notifications_email_enabled BOOLEAN DEFAULT true,
      content_team_notifications_push_enabled BOOLEAN DEFAULT false,
      content_team_notifications_email_enabled BOOLEAN DEFAULT false,
      user_notifications_push_enabled BOOLEAN DEFAULT true,
      user_notifications_email_enabled BOOLEAN DEFAULT true,
      updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `)

  // Create push_notifications table
  await payload.db.drizzle.execute(sql`
    CREATE TABLE IF NOT EXISTS push_notifications (
      id SERIAL PRIMARY KEY,
      title VARCHAR NOT NULL,
      body TEXT NOT NULL,
      target_roles JSONB NOT NULL,
      status VARCHAR DEFAULT 'draft' NOT NULL,
      recipient_count INTEGER,
      error TEXT,
      sent_at TIMESTAMP(3) WITH TIME ZONE,
      updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `)

  // Add emailNotificationsEnabled column to users table
  await payload.db.drizzle.execute(sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true
  `)

  // Seed initial notification settings with sensible defaults
  const notificationTypes = [
    {
      type: 'user_registers',
      adminPush: true,
      adminEmail: true,
      contentPush: true,
      contentEmail: true,
      userPush: false,
      userEmail: false,
    },
    {
      type: 'user_approved',
      adminPush: false,
      adminEmail: false,
      contentPush: false,
      contentEmail: false,
      userPush: true,
      userEmail: true,
    },
    {
      type: 'user_deactivated',
      adminPush: false,
      adminEmail: false,
      contentPush: false,
      contentEmail: false,
      userPush: true,
      userEmail: true,
    },
    {
      type: 'user_deleted',
      adminPush: false,
      adminEmail: false,
      contentPush: false,
      contentEmail: false,
      userPush: false,
      userEmail: true,
    },
    {
      type: 'base_change_request_submitted',
      adminPush: true,
      adminEmail: true,
      contentPush: true,
      contentEmail: true,
      userPush: false,
      userEmail: false,
    },
    {
      type: 'hospital_change_request_submitted',
      adminPush: true,
      adminEmail: true,
      contentPush: true,
      contentEmail: true,
      userPush: false,
      userEmail: false,
    },
    {
      type: 'new_base_submitted',
      adminPush: true,
      adminEmail: true,
      contentPush: true,
      contentEmail: true,
      userPush: false,
      userEmail: false,
    },
    {
      type: 'new_hospital_submitted',
      adminPush: true,
      adminEmail: true,
      contentPush: true,
      contentEmail: true,
      userPush: false,
      userEmail: false,
    },
    {
      type: 'request_approved',
      adminPush: false,
      adminEmail: false,
      contentPush: false,
      contentEmail: false,
      userPush: true,
      userEmail: true,
    },
    {
      type: 'request_denied',
      adminPush: false,
      adminEmail: false,
      contentPush: false,
      contentEmail: false,
      userPush: true,
      userEmail: true,
    },
  ]

  for (const notif of notificationTypes) {
    await payload.db.drizzle.execute(sql`
      INSERT INTO notification_settings (
        notification_type,
        admin_notifications_push_enabled,
        admin_notifications_email_enabled,
        content_team_notifications_push_enabled,
        content_team_notifications_email_enabled,
        user_notifications_push_enabled,
        user_notifications_email_enabled
      )
      VALUES (
        ${notif.type},
        ${notif.adminPush},
        ${notif.adminEmail},
        ${notif.contentPush},
        ${notif.contentEmail},
        ${notif.userPush},
        ${notif.userEmail}
      )
      ON CONFLICT (notification_type) DO NOTHING
    `)
  }

  console.log('✓ Notification settings migration completed successfully')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Remove emailNotificationsEnabled column from users table
  await payload.db.drizzle.execute(sql`
    ALTER TABLE users
    DROP COLUMN IF EXISTS email_notifications_enabled
  `)

  // Drop push_notifications table
  await payload.db.drizzle.execute(sql`
    DROP TABLE IF EXISTS push_notifications
  `)

  // Drop notification_settings table
  await payload.db.drizzle.execute(sql`
    DROP TABLE IF EXISTS notification_settings
  `)

  console.log('✓ Notification settings migration rolled back successfully')
}
