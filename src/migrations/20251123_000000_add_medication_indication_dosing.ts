import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Migration: Indication-based medication dosing
 *
 * - Removes legacy top-level scope + doses tables
 * - Adds nested tables to support medicationIndications > routes > scope
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Drop legacy tables
    DROP TABLE IF EXISTS "medications_scope";
    DROP TABLE IF EXISTS "medications_doses";

    -- Create indication array table
    CREATE TABLE IF NOT EXISTS "medications_medication_indications" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "indication" varchar,
      "clinical_context" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'medications_medication_indications_parent_fk'
      ) THEN
        ALTER TABLE "medications_medication_indications" ADD CONSTRAINT "medications_medication_indications_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "medications_medication_indications_order_idx"
      ON "medications_medication_indications" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "medications_medication_indications_parent_idx"
      ON "medications_medication_indications" USING btree ("_parent_id");

    -- Create indication route table
    CREATE TABLE IF NOT EXISTS "medications_medication_indications_routes" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "route" varchar,
      "adult_dose" varchar,
      "pediatric_dose" varchar,
      "concentration" varchar,
      "interval" varchar,
      "max_dose" varchar,
      "rate" varchar,
      "titration_goal" varchar,
      "notes" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'medications_medication_indications_routes_parent_fk'
      ) THEN
        ALTER TABLE "medications_medication_indications_routes" ADD CONSTRAINT "medications_medication_indications_routes_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."medications_medication_indications"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "medications_medication_indications_routes_order_idx"
      ON "medications_medication_indications_routes" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "medications_medication_indications_routes_parent_idx"
      ON "medications_medication_indications_routes" USING btree ("_parent_id");

    -- Create route scope table
    CREATE TABLE IF NOT EXISTS "medications_medication_indications_routes_scope" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'medications_medication_indications_routes_scope_parent_fk'
      ) THEN
        ALTER TABLE "medications_medication_indications_routes_scope" ADD CONSTRAINT "medications_medication_indications_routes_scope_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."medications_medication_indications_routes"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "medications_medication_indications_routes_scope_order_idx"
      ON "medications_medication_indications_routes_scope" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "medications_medication_indications_routes_scope_parent_idx"
      ON "medications_medication_indications_routes_scope" USING btree ("parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop new indication tables
    DROP TABLE IF EXISTS "medications_medication_indications_routes_scope";
    DROP TABLE IF EXISTS "medications_medication_indications_routes";
    DROP TABLE IF EXISTS "medications_medication_indications";

    -- Re-create legacy scope table
    CREATE TABLE IF NOT EXISTS "medications_scope" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" varchar,
      "id" varchar PRIMARY KEY NOT NULL
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'medications_scope_parent_fk'
      ) THEN
        ALTER TABLE "medications_scope" ADD CONSTRAINT "medications_scope_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "medications_scope_order_idx" ON "medications_scope" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "medications_scope_parent_idx" ON "medications_scope" USING btree ("parent_id");

    -- Re-create legacy doses table
    CREATE TABLE IF NOT EXISTS "medications_doses" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "route" varchar,
      "adult_dose" varchar,
      "pediatric_dose" varchar,
      "concentration" varchar,
      "interval" varchar,
      "max_dose" varchar,
      "rate" varchar
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'medications_doses_parent_fk'
      ) THEN
        ALTER TABLE "medications_doses" ADD CONSTRAINT "medications_doses_parent_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "medications_doses_order_idx" ON "medications_doses" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "medications_doses_parent_idx" ON "medications_doses" USING btree ("_parent_id");
  `)
}
