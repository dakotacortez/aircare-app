import * as migration_20250214_000000_protocols from './20250214_000000_protocols';
import * as migration_20251111_035941 from './20251111_035941';
import * as migration_20251111_043054 from './20251111_043054';
import * as migration_20251111_043434 from './20251111_043434';

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
];
