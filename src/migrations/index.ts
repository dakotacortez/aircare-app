import * as migration_20250214_000000_protocols from './20250214_000000_protocols';
import * as migration_20251111_035941 from './20251111_035941';
import * as migration_20251111_043054 from './20251111_043054';
import * as migration_20251111_043434 from './20251111_043434';
import * as migration_20251111_142444_add_user_roles_and_approval from './20251111_142444_add_user_roles_and_approval';
import * as migration_20251111_210353_add_logo_and_site_settings from './20251111_210353_add_logo_and_site_settings';

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
];
