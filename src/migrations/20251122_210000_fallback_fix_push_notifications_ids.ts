import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fallback migration to align push_notifications identifiers with text-based IDs.
 *
 * Fixes issues where Payload attempts to insert 24-character IDs into integer
 * columns by ensuring the push_notifications.id, push_notifications_target_roles.parent_id,
 * and payload_locked_documents_rels.push_notifications_id columns use text.
 */
export async function up({ payload, db }: MigrateUpArgs): Promise<void> {
  // Ensure push_notifications table exists with text ID
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'push_notifications'
      ) THEN
        CREATE TABLE push_notifications (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          title varchar NOT NULL,
          body text NOT NULL,
          status varchar DEFAULT 'draft' NOT NULL,
          recipient_count integer,
          error text,
          sent_at timestamp(3) with time zone,
          updated_at timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
          created_at timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
          created_by_id integer
        );
      END IF;
    END $$;
  `)

  // Drop FK constraints that rely on integer parent_id
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'push_notifications_target_roles_parent_fk'
          AND table_name = 'push_notifications_target_roles'
      ) THEN
        ALTER TABLE push_notifications_target_roles
        DROP CONSTRAINT push_notifications_target_roles_parent_fk;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'push_notifications_target_roles_parent_id_fk'
          AND table_name = 'push_notifications_target_roles'
      ) THEN
        ALTER TABLE push_notifications_target_roles
        DROP CONSTRAINT push_notifications_target_roles_parent_id_fk;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payload_locked_documents_rels_push_notifications_id_fk'
          AND table_name = 'payload_locked_documents_rels'
      ) THEN
        ALTER TABLE payload_locked_documents_rels
        DROP CONSTRAINT payload_locked_documents_rels_push_notifications_id_fk;
      END IF;
    END $$;
  `)

  // Convert push_notifications.id to text and add UUID default
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'push_notifications'
          AND column_name = 'id'
          AND data_type <> 'character varying'
      ) THEN
        ALTER TABLE push_notifications
        ALTER COLUMN id DROP DEFAULT,
        ALTER COLUMN id TYPE varchar USING id::varchar;
      END IF;

      ALTER TABLE push_notifications
      ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    END $$;
  `)

  // Ensure push_notifications_target_roles table exists with text FK
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'push_notifications_target_roles'
      ) THEN
        CREATE TABLE push_notifications_target_roles (
          "order" integer NOT NULL,
          parent_id varchar NOT NULL,
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          value varchar NOT NULL
        );
      END IF;
    END $$;
  `)

  // Convert parent_id to text
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'push_notifications_target_roles'
          AND column_name = 'parent_id'
          AND data_type <> 'character varying'
      ) THEN
        ALTER TABLE push_notifications_target_roles
        ALTER COLUMN parent_id TYPE varchar USING parent_id::varchar;
      END IF;
    END $$;
  `)

  // Convert payload_locked_documents_rels.push_notifications_id to text when present
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payload_locked_documents_rels'
          AND column_name = 'push_notifications_id'
      ) THEN
        ALTER TABLE payload_locked_documents_rels
        ALTER COLUMN push_notifications_id TYPE varchar USING push_notifications_id::varchar;
      END IF;
    END $$;
  `)

  // Recreate FK constraints and indexes
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'push_notifications_target_roles_parent_id_fk'
          AND table_name = 'push_notifications_target_roles'
      ) THEN
        ALTER TABLE push_notifications_target_roles
        ADD CONSTRAINT push_notifications_target_roles_parent_id_fk
          FOREIGN KEY (parent_id) REFERENCES push_notifications(id)
          ON DELETE CASCADE ON UPDATE NO ACTION;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payload_locked_documents_rels'
          AND column_name = 'push_notifications_id'
      ) THEN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'payload_locked_documents_rels_push_notifications_id_fk'
            AND table_name = 'payload_locked_documents_rels'
        ) THEN
          ALTER TABLE payload_locked_documents_rels
          ADD CONSTRAINT payload_locked_documents_rels_push_notifications_id_fk
            FOREIGN KEY (push_notifications_id) REFERENCES push_notifications(id)
            ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END IF;
    END $$;
  `)

  await payload.db.drizzle.execute(sql`
    CREATE INDEX IF NOT EXISTS push_notifications_target_roles_order_idx
      ON push_notifications_target_roles USING btree ("order")
  `)

  await payload.db.drizzle.execute(sql`
    CREATE INDEX IF NOT EXISTS push_notifications_target_roles_parent_idx
      ON push_notifications_target_roles USING btree (parent_id)
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Revert columns back to integers where possible
  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'push_notifications'
          AND column_name = 'id'
          AND data_type = 'character varying'
      ) THEN
        ALTER TABLE push_notifications
        ALTER COLUMN id DROP DEFAULT,
        ALTER COLUMN id TYPE integer USING id::integer;
      END IF;
    END $$;
  `)

  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'push_notifications_target_roles'
          AND column_name = 'parent_id'
          AND data_type = 'character varying'
      ) THEN
        ALTER TABLE push_notifications_target_roles
        ALTER COLUMN parent_id TYPE integer USING parent_id::integer;
      END IF;
    END $$;
  `)

  await payload.db.drizzle.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payload_locked_documents_rels'
          AND column_name = 'push_notifications_id'
          AND data_type = 'character varying'
      ) THEN
        ALTER TABLE payload_locked_documents_rels
        ALTER COLUMN push_notifications_id TYPE integer USING push_notifications_id::integer;
      END IF;
    END $$;
  `)
}
