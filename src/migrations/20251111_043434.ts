import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "protocols" DROP COLUMN "next_review";
  ALTER TABLE "_protocols_v" DROP COLUMN "version_next_review";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "protocols" ADD COLUMN "next_review" timestamp(3) with time zone;
  ALTER TABLE "_protocols_v" ADD COLUMN "version_next_review" timestamp(3) with time zone;`)
}
