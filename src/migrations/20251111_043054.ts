import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE UNIQUE INDEX "protocols_protocol_number_idx" ON "protocols" USING btree ("protocol_number");
  CREATE INDEX "_protocols_v_version_version_protocol_number_idx" ON "_protocols_v" USING btree ("version_protocol_number");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "protocols_protocol_number_idx";
  DROP INDEX "_protocols_v_version_version_protocol_number_idx";`)
}
