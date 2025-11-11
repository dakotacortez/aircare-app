import * as migration_20251109_190453_init from './20251109_190453_init';

export const migrations = [
  {
    up: migration_20251109_190453_init.up,
    down: migration_20251109_190453_init.down,
    name: '20251109_190453_init',
  },
];
