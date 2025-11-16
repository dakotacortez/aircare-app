import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add slug fields to hospitals and bases collections
 *
 * Adds a unique slug field to both hospitals and bases tables,
 * then populates slugs for existing records based on their names.
 */

// Helper function to generate a slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  // Add slug column to hospitals table
  await db.execute(sql`
    ALTER TABLE "hospitals"
      ADD COLUMN IF NOT EXISTS "slug" varchar;
  `)

  // Add slug column to bases table
  await db.execute(sql`
    ALTER TABLE "bases"
      ADD COLUMN IF NOT EXISTS "slug" varchar;
  `)

  // Populate slugs for existing hospitals
  const hospitalsResult = await db.execute(sql`
    SELECT id, name FROM "hospitals" WHERE slug IS NULL
  `)

  if (hospitalsResult.rows && hospitalsResult.rows.length > 0) {
    for (const row of hospitalsResult.rows) {
      const slug = generateSlug(row.name as string)

      // Check for duplicates and append a number if needed
      let finalSlug = slug
      let counter = 1

      while (true) {
        const existing = await db.execute(sql`
          SELECT id FROM "hospitals" WHERE slug = ${finalSlug} AND id != ${row.id}
        `)

        if (!existing.rows || existing.rows.length === 0) {
          break
        }

        finalSlug = `${slug}-${counter}`
        counter++
      }

      await db.execute(sql`
        UPDATE "hospitals" SET slug = ${finalSlug} WHERE id = ${row.id}
      `)
    }
  }

  // Populate slugs for existing bases
  const basesResult = await db.execute(sql`
    SELECT id, name FROM "bases" WHERE slug IS NULL
  `)

  if (basesResult.rows && basesResult.rows.length > 0) {
    for (const row of basesResult.rows) {
      const slug = generateSlug(row.name as string)

      // Check for duplicates and append a number if needed
      let finalSlug = slug
      let counter = 1

      while (true) {
        const existing = await db.execute(sql`
          SELECT id FROM "bases" WHERE slug = ${finalSlug} AND id != ${row.id}
        `)

        if (!existing.rows || existing.rows.length === 0) {
          break
        }

        finalSlug = `${slug}-${counter}`
        counter++
      }

      await db.execute(sql`
        UPDATE "bases" SET slug = ${finalSlug} WHERE id = ${row.id}
      `)
    }
  }

  // Add unique constraint and NOT NULL after populating data
  await db.execute(sql`
    DO $$
    BEGIN
      ALTER TABLE "hospitals"
        ALTER COLUMN "slug" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "hospitals"
        ADD CONSTRAINT "hospitals_slug_unique" UNIQUE ("slug");
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "bases"
        ALTER COLUMN "slug" SET NOT NULL;
    EXCEPTION
      WHEN others THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "bases"
        ADD CONSTRAINT "bases_slug_unique" UNIQUE ("slug");
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  // Create indexes for better performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "hospitals_slug_idx" ON "hospitals" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "bases_slug_idx" ON "bases" USING btree ("slug");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Remove indexes
  await db.execute(sql`
    DROP INDEX IF EXISTS "hospitals_slug_idx";
    DROP INDEX IF EXISTS "bases_slug_idx";
  `)

  // Remove unique constraints
  await db.execute(sql`
    DO $$
    BEGIN
      ALTER TABLE "hospitals"
        DROP CONSTRAINT "hospitals_slug_unique";
    EXCEPTION
      WHEN undefined_object THEN null;
    END $$;

    DO $$
    BEGIN
      ALTER TABLE "bases"
        DROP CONSTRAINT "bases_slug_unique";
    EXCEPTION
      WHEN undefined_object THEN null;
    END $$;
  `)

  // Remove slug columns
  await db.execute(sql`
    ALTER TABLE "hospitals"
      DROP COLUMN IF EXISTS "slug";

    ALTER TABLE "bases"
      DROP COLUMN IF EXISTS "slug";
  `)
}
