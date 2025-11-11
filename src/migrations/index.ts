import * as migration_20251109_190453_init from './20251109_190453_init';
import * as migration_20251111_035941 from './20251111_035941';

export const migrations = [
  {
    up: migration_20251109_190453_init.up,
    down: migration_20251109_190453_init.down,
    name: '20251109_190453_init',
  },
  {
    up: migration_20251111_035941.up,
    down: migration_20251111_035941.down,
    name: '20251111_035941'
  },
];
