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
import * as migration_20251116_232000_fix_door_codes_label from './20251116_232000_fix_door_codes_label';
import * as migration_20251116_235500_update_door_codes_schema from './20251116_235500_update_door_codes_schema';

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
      up: migration_20251116_232000_fix_door_codes_label.up,
      down: migration_20251116_232000_fix_door_codes_label.down,
      name: '20251116_232000_fix_door_codes_label'
    },
      {
        up: migration_20251116_235500_update_door_codes_schema.up,
        down: migration_20251116_235500_update_door_codes_schema.down,
        name: '20251116_235500_update_door_codes_schema'
      },
];
