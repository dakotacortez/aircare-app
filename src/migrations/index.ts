import type { Migration } from 'payload';

import * as migration_20250214_000000_protocols from './20250214_000000_protocols';
import * as migration_20251111_035941 from './20251111_035941';
import * as migration_20251111_043054 from './20251111_043054';
import * as migration_20251111_043434 from './20251111_043434';
import * as migration_20251111_142444_add_user_roles_and_approval from './20251111_142444_add_user_roles_and_approval';
import * as migration_20251111_210353_add_logo_and_site_settings from './20251111_210353_add_logo_and_site_settings';
import * as migration_20251112_000000_add_gradient_settings from './20251112_000000_add_gradient_settings';
import * as migration_20251116_143000_add_push_notifications_enabled from './20251116_143000_add_push_notifications_enabled';
import * as migration_20251116_144000_add_profile_image from './20251116_144000_add_profile_image';
import * as migration_20251116_200500_fix_missing_user_and_assets_columns from './20251116_200500_fix_missing_user_and_assets_columns';
import * as migration_20251116_231200_create_bases_rels from './20251116_231200_create_bases_rels';
import * as migration_20251116_232000_fix_door_codes_label from './20251116_232000_fix_door_codes_label';
import * as migration_20251116_235500_update_door_codes_schema from './20251116_235500_update_door_codes_schema';
import * as migration_20251117_000100_add_hospital_capability_level_description from './20251117_000100_add_hospital_capability_level_description';
import * as migration_20251117_010500_expand_hospital_info_card from './20251117_010500_expand_hospital_info_card';
import * as migration_20251117_020000_add_coordinates_field from './20251117_020000_add_coordinates_field';
import * as migration_20251117_020100_add_slug_fields from './20251117_020100_add_slug_fields';
import * as migration_20251117_020200_expand_bases_and_assets from './20251117_020200_expand_bases_and_assets';
import * as migration_20251117_030300_add_door_code_notes from './20251117_030300_add_door_code_notes';
import * as migration_20251117_040000_ensure_base_schema from './20251117_040000_ensure_base_schema';
import * as migration_20251117_040100_ensure_hospital_schema from './20251117_040100_ensure_hospital_schema';
import * as migration_20251117_040200_ensure_change_request_schema from './20251117_040200_ensure_change_request_schema';
import * as migration_20251117_040300_ensure_reference_schema from './20251117_040300_ensure_reference_schema';
import * as migration_20251117_050000_add_missing_locked_documents_rels_columns from './20251117_050000_add_missing_locked_documents_rels_columns';
import * as migration_20251117_050100_add_missing_change_request_columns from './20251117_050100_add_missing_change_request_columns';
import * as migration_20251119_000000_add_meta_site_name_and_twitter from './20251119_000000_add_meta_site_name_and_twitter';
import * as migration_20251120_000000_add_hospital_cr_source_attribution from './20251120_000000_add_hospital_cr_source_attribution';
import * as migration_20251120_030000_add_notifications_and_audit_trail from './20251120_030000_add_notifications_and_audit_trail';
import * as migration_20251120_120000_readd_hospital_cr_source_attribution from './20251120_120000_readd_hospital_cr_source_attribution';
import * as migration_20251121_000000_fix_missing_columns from './20251121_000000_fix_missing_columns';
import * as migration_20251121_000001_add_audit_log_id_to_locked_docs_rels from './20251121_000001_add_audit_log_id_to_locked_docs_rels';
import * as migration_20251121_120000_add_notification_settings from './20251121_120000_add_notification_settings';
import * as migration_20251121_143000_fix_push_notifications_target_roles from './20251121_143000_fix_push_notifications_target_roles';

const toMigration = (
  name: string,
  migration: { up: (...args: unknown[]) => Promise<void>; down: (...args: unknown[]) => Promise<void> },
): Migration => ({
  name,
  up: migration.up as Migration['up'],
  down: migration.down as Migration['down'],
});

export const migrations: Migration[] = [
  toMigration('20250214_000000_protocols', migration_20250214_000000_protocols),
  toMigration('20251111_035941', migration_20251111_035941),
  toMigration('20251111_043054', migration_20251111_043054),
  toMigration('20251111_043434', migration_20251111_043434),
  toMigration(
    '20251111_142444_add_user_roles_and_approval',
    migration_20251111_142444_add_user_roles_and_approval,
  ),
  toMigration('20251111_210353_add_logo_and_site_settings', migration_20251111_210353_add_logo_and_site_settings),
  toMigration('20251112_000000_add_gradient_settings', migration_20251112_000000_add_gradient_settings),
  toMigration(
    '20251116_143000_add_push_notifications_enabled',
    migration_20251116_143000_add_push_notifications_enabled,
  ),
  toMigration('20251116_144000_add_profile_image', migration_20251116_144000_add_profile_image),
  toMigration(
    '20251116_200500_fix_missing_user_and_assets_columns',
    migration_20251116_200500_fix_missing_user_and_assets_columns,
  ),
  toMigration('20251116_231200_create_bases_rels', migration_20251116_231200_create_bases_rels),
  toMigration('20251116_232000_fix_door_codes_label', migration_20251116_232000_fix_door_codes_label),
  toMigration('20251116_235500_update_door_codes_schema', migration_20251116_235500_update_door_codes_schema),
  toMigration(
    '20251117_000100_add_hospital_capability_level_description',
    migration_20251117_000100_add_hospital_capability_level_description,
  ),
  toMigration('20251117_010500_expand_hospital_info_card', migration_20251117_010500_expand_hospital_info_card),
  toMigration('20251117_020000_add_coordinates_field', migration_20251117_020000_add_coordinates_field),
  toMigration('20251117_020100_add_slug_fields', migration_20251117_020100_add_slug_fields),
  toMigration('20251117_020200_expand_bases_and_assets', migration_20251117_020200_expand_bases_and_assets),
  toMigration('20251117_030300_add_door_code_notes', migration_20251117_030300_add_door_code_notes),
  toMigration('20251117_040000_ensure_base_schema', migration_20251117_040000_ensure_base_schema),
  toMigration('20251117_040100_ensure_hospital_schema', migration_20251117_040100_ensure_hospital_schema),
  toMigration('20251117_040200_ensure_change_request_schema', migration_20251117_040200_ensure_change_request_schema),
  toMigration('20251117_040300_ensure_reference_schema', migration_20251117_040300_ensure_reference_schema),
  toMigration(
    '20251117_050000_add_missing_locked_documents_rels_columns',
    migration_20251117_050000_add_missing_locked_documents_rels_columns,
  ),
  toMigration(
    '20251117_050100_add_missing_change_request_columns',
    migration_20251117_050100_add_missing_change_request_columns,
  ),
  toMigration('20251119_000000_add_meta_site_name_and_twitter', migration_20251119_000000_add_meta_site_name_and_twitter),
  toMigration(
    '20251120_000000_add_hospital_cr_source_attribution',
    migration_20251120_000000_add_hospital_cr_source_attribution,
  ),
  toMigration(
    '20251120_030000_add_notifications_and_audit_trail',
    migration_20251120_030000_add_notifications_and_audit_trail,
  ),
  toMigration(
    '20251120_120000_readd_hospital_cr_source_attribution',
    migration_20251120_120000_readd_hospital_cr_source_attribution,
  ),
  toMigration('20251121_000000_fix_missing_columns', migration_20251121_000000_fix_missing_columns),
  toMigration(
    '20251121_000001_add_audit_log_id_to_locked_docs_rels',
    migration_20251121_000001_add_audit_log_id_to_locked_docs_rels,
  ),
  toMigration('20251121_120000_add_notification_settings', migration_20251121_120000_add_notification_settings),
  toMigration('20251121_143000_fix_push_notifications_target_roles', migration_20251121_143000_fix_push_notifications_target_roles),
];

export default migrations;
