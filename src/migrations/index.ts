import * as migration_20251109_190453_init from './20251109_190453_init';
import * as migration_20251109_213402 from './20251109_213402';
import * as migration_20251110_041722 from './20251110_041722';
import * as migration_20251110_042242 from './20251110_042242';

export const migrations = [
  {
    up: migration_20251109_190453_init.up,
    down: migration_20251109_190453_init.down,
    name: '20251109_190453_init',
  },
  {
    up: migration_20251109_213402.up,
    down: migration_20251109_213402.down,
    name: '20251109_213402',
  },
  {
    up: migration_20251110_041722.up,
    down: migration_20251110_041722.down,
    name: '20251110_041722',
  },
  {
    up: migration_20251110_042242.up,
    down: migration_20251110_042242.down,
    name: '20251110_042242'
  },
];
