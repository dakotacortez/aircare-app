import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Ensure the join table for bases <-> assets relationships exists.
 *
 * Fixes admin queries that expect the `bases_rels` table for the many-to-many
 * relationship on `bases.assets`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "bases_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "assets_id" integer
    );

    DO $$
    BEGIN
      ALTER TABLE "bases_rels"
        ADD CONSTRAINT "bases_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "bases"("id")
        ON DELETE cascade
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "bases_rels"
        ADD CONSTRAINT "bases_rels_assets_fk"
        FOREIGN KEY ("assets_id") REFERENCES "assets"("id")
        ON DELETE set null
        ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "bases_rels_order_idx" ON "bases_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "bases_rels_parent_idx" ON "bases_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "bases_rels_path_idx" ON "bases_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "bases_rels_assets_id_idx" ON "bases_rels" USING btree ("assets_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "bases_rels";
  `)
}
