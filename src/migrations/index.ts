import * as migration_20250214_000000_protocols from './20250214_000000_protocols'

export const migrations = [
  {
    up: migration_20250214_000000_protocols.up,
    down: migration_20250214_000000_protocols.down,
  },
]
