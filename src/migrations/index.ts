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

export const migrations = [
  {
    up: migration_20250214_000000_protocols.up,
    down: migration_20250214_000000_protocols.down,
  },
  {
    up: migration_20251111_035941.up,
    down: migration_20251111_035941.down,
    name: '20251111_035941',
  },
  {
    up: migration_20251111_043054.up,
    down: migration_20251111_043054.down,
    name: '20251111_043054',
  },
  {
    up: migration_20251111_043434.up,
    down: migration_20251111_043434.down,
    name: '20251111_043434'
  },
  {
    up: migration_20251111_142444_add_user_roles_and_approval.up,
    down: migration_20251111_142444_add_user_roles_and_approval.down,
    name: '20251111_142444_add_user_roles_and_approval'
  },
  {
    up: migration_20251111_210353_add_logo_and_site_settings.up,
    down: migration_20251111_210353_add_logo_and_site_settings.down,
    name: '20251111_210353_add_logo_and_site_settings'
  },
    {
      up: migration_20251112_000000_add_gradient_settings.up,
      down: migration_20251112_000000_add_gradient_settings.down,
      name: '20251112_000000_add_gradient_settings'
    },
    {
      up: migration_20251116_143000_add_push_notifications_enabled.up,
      down: migration_20251116_143000_add_push_notifications_enabled.down,
      name: '20251116_143000_add_push_notifications_enabled'
    },
    {
      up: migration_20251116_144000_add_profile_image.up,
      down: migration_20251116_144000_add_profile_image.down,
      name: '20251116_144000_add_profile_image'
    },
    {
      up: migration_20251116_200500_fix_missing_user_and_assets_columns.up,
      down: migration_20251116_200500_fix_missing_user_and_assets_columns.down,
      name: '20251116_200500_fix_missing_user_and_assets_columns'
    },
      {
        up: migration_20251116_231200_create_bases_rels.up,
        down: migration_20251116_231200_create_bases_rels.down,
        name: '20251116_231200_create_bases_rels'
      },
    {
      up: migration_20251116_232000_fix_door_codes_label.up,
      down: migration_20251116_232000_fix_door_codes_label.down,
      name: '20251116_232000_fix_door_codes_label'
    },
      {
        up: migration_20251116_235500_update_door_codes_schema.up,
        down: migration_20251116_235500_update_door_codes_schema.down,
        name: '20251116_235500_update_door_codes_schema'
      },
        {
          up: migration_20251117_000100_add_hospital_capability_level_description.up,
          down: migration_20251117_000100_add_hospital_capability_level_description.down,
          name: '20251117_000100_add_hospital_capability_level_description'
        },
    {
      up: migration_20251117_010500_expand_hospital_info_card.up,
      down: migration_20251117_010500_expand_hospital_info_card.down,
      name: '20251117_010500_expand_hospital_info_card'
    },
    {
      up: migration_20251117_020000_add_coordinates_field.up,
      down: migration_20251117_020000_add_coordinates_field.down,
      name: '20251117_020000_add_coordinates_field'
    },
    {
      up: migration_20251117_020100_add_slug_fields.up,
      down: migration_20251117_020100_add_slug_fields.down,
      name: '20251117_020100_add_slug_fields'
    },
    {
      up: migration_20251117_020200_expand_bases_and_assets.up,
      down: migration_20251117_020200_expand_bases_and_assets.down,
      name: '20251117_020200_expand_bases_and_assets'
    },
    {
      up: migration_20251117_030300_add_door_code_notes.up,
      down: migration_20251117_030300_add_door_code_notes.down,
      name: '20251117_030300_add_door_code_notes'
    },
    {
      up: migration_20251117_040000_ensure_base_schema.up,
      down: migration_20251117_040000_ensure_base_schema.down,
      name: '20251117_040000_ensure_base_schema'
    },
    {
      up: migration_20251117_040100_ensure_hospital_schema.up,
      down: migration_20251117_040100_ensure_hospital_schema.down,
      name: '20251117_040100_ensure_hospital_schema'
    },
    {
      up: migration_20251117_040200_ensure_change_request_schema.up,
      down: migration_20251117_040200_ensure_change_request_schema.down,
      name: '20251117_040200_ensure_change_request_schema'
    },
    {
      up: migration_20251117_040300_ensure_reference_schema.up,
      down: migration_20251117_040300_ensure_reference_schema.down,
      name: '20251117_040300_ensure_reference_schema'
    },
    {
      up: migration_20251117_050000_add_missing_locked_documents_rels_columns.up,
      down: migration_20251117_050000_add_missing_locked_documents_rels_columns.down,
      name: '20251117_050000_add_missing_locked_documents_rels_columns'
    },
    {
      up: migration_20251117_050100_add_missing_change_request_columns.up,
      down: migration_20251117_050100_add_missing_change_request_columns.down,
      name: '20251117_050100_add_missing_change_request_columns'
    },
    {
      up: migration_20251119_000000_add_meta_site_name_and_twitter.up,
      down: migration_20251119_000000_add_meta_site_name_and_twitter.down,
      name: '20251119_000000_add_meta_site_name_and_twitter'
    },
    {
      up: migration_20251120_000000_add_hospital_cr_source_attribution.up,
      down: migration_20251120_000000_add_hospital_cr_source_attribution.down,
      name: '20251120_000000_add_hospital_cr_source_attribution'
    },
    {
      up: migration_20251120_030000_add_notifications_and_audit_trail.up,
      down: migration_20251120_030000_add_notifications_and_audit_trail.down,
      name: '20251120_030000_add_notifications_and_audit_trail'
    },
    {
      up: migration_20251120_120000_readd_hospital_cr_source_attribution.up,
      down: migration_20251120_120000_readd_hospital_cr_source_attribution.down,
      name: '20251120_120000_readd_hospital_cr_source_attribution'
    },
    {
      up: migration_20251121_000000_fix_missing_columns.up,
      down: migration_20251121_000000_fix_missing_columns.down,
      name: '20251121_000000_fix_missing_columns'
    },
    {
      up: migration_20251121_000001_add_audit_log_id_to_locked_docs_rels.up,
      down: migration_20251121_000001_add_audit_log_id_to_locked_docs_rels.down,
      name: '20251121_000001_add_audit_log_id_to_locked_docs_rels'
    },
  ];
