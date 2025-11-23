import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

const CLASS_SEEDS = [
  ['Vasopressor', 'vasopressor'],
  ['Antiarrhythmic', 'antiarrhythmic'],
  ['Analgesic', 'analgesic'],
  ['Sedative', 'sedative'],
  ['Antiemetic', 'antiemetic'],
  ['Bronchodilator', 'bronchodilator'],
  ['Anticonvulsant', 'anticonvulsant'],
  ['Antihypertensive', 'antihypertensive'],
  ['Antiplatelet', 'antiplatelet'],
  ['Anticoagulant', 'anticoagulant'],
  ['Paralytic', 'paralytic'],
  ['Reversal', 'reversal'],
  ['Other', 'other'],
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create medication_classes table
    CREATE TABLE IF NOT EXISTS "medication_classes" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "description" text,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "medication_classes_slug_unique"
      ON "medication_classes" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "medication_classes_name_idx"
      ON "medication_classes" USING btree ("name");
  `)

  // Seed lookup rows for known classes
  for (const [name, slug] of CLASS_SEEDS) {
    await db.execute(
      sql`INSERT INTO "medication_classes" ("name", "slug")
          VALUES (${name}, ${slug})
          ON CONFLICT ("slug") DO NOTHING`,
    )
  }

  // Ensure medications table has the relationship column
  await db.execute(sql`
    ALTER TABLE "medications"
      ADD COLUMN IF NOT EXISTS "class_id" integer;
  `)

  // Backfill class_id from the legacy enum column (if it exists)
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'medications'
          AND column_name = 'class'
      ) THEN
        UPDATE "medications" AS m
        SET "class_id" = mc."id"
        FROM "medication_classes" AS mc
        WHERE mc."slug" = m."class"::text;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "medications"
      ALTER COLUMN "class_id" SET NOT NULL;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'medications_class_fk'
      ) THEN
        ALTER TABLE "medications"
          ADD CONSTRAINT "medications_class_fk"
            FOREIGN KEY ("class_id")
            REFERENCES "medication_classes"("id")
            ON DELETE restrict ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "medications_class_id_idx"
      ON "medications" USING btree ("class_id");

    DROP INDEX IF EXISTS "medications_class_idx";
    ALTER TABLE "medications"
      DROP COLUMN IF EXISTS "class";
    DROP TYPE IF EXISTS "public"."enum_medications_class";
  `)

  // Add medication_classes to payload_locked_documents_rels for admin UI locks
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "medication_classes_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_medication_classes_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
          ADD CONSTRAINT "payload_locked_documents_rels_medication_classes_fk"
            FOREIGN KEY ("medication_classes_id")
            REFERENCES "medication_classes"("id")
            ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_medication_classes_id_idx"
      ON "payload_locked_documents_rels" USING btree ("medication_classes_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Recreate enum type and column for medications.class
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_medications_class') THEN
        CREATE TYPE "public"."enum_medications_class" AS ENUM(
          'vasopressor', 'antiarrhythmic', 'analgesic', 'sedative',
          'antiemetic', 'bronchodilator', 'anticonvulsant', 'antihypertensive',
          'antiplatelet', 'anticoagulant', 'paralytic', 'reversal', 'other'
        );
      END IF;
    END $$;

    ALTER TABLE "medications"
      ADD COLUMN IF NOT EXISTS "class" "public"."enum_medications_class";
  `)

  await db.execute(sql`
    UPDATE "medications" AS m
    SET "class" = mc."slug"::"public"."enum_medications_class"
    FROM "medication_classes" AS mc
    WHERE mc."id" = m."class_id";

    ALTER TABLE "medications"
      ALTER COLUMN "class" SET NOT NULL;

    CREATE INDEX IF NOT EXISTS "medications_class_idx"
      ON "medications" USING btree ("class");
  `)

  await db.execute(sql`
    ALTER TABLE "medications"
      DROP CONSTRAINT IF EXISTS "medications_class_fk";
    DROP INDEX IF EXISTS "medications_class_id_idx";
    ALTER TABLE "medications"
      DROP COLUMN IF EXISTS "class_id";
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_medication_classes_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_medication_classes_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "medication_classes_id";
  `)

  await db.execute(sql`
    DROP TABLE IF EXISTS "medication_classes";
  `)
}
