import type { CollectionConfig } from 'payload'
import { isLoggedIn, isContentOrAdmin } from '../access/roles'

/**
 * Assets Collection
 * Tracks EMS vehicles and units (ambulances, helicopters, etc.)
 * Each asset can only be assigned to one base at a time
 */
export const Assets: CollectionConfig = {
  slug: 'assets',
  labels: {
    singular: 'Asset',
    plural: 'Assets',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'tailNumber'],
    group: 'Operations',
    description: 'EMS vehicles and units (ambulances, helicopters, etc.)',
  },
  access: {
    // Only logged in users can read (no guests)
    read: isLoggedIn,
    // Only content team or admin can create, update, delete
    create: isContentOrAdmin,
    update: isContentOrAdmin,
    delete: isContentOrAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Asset Name',
      unique: true,
      admin: {
        description: 'Unique identifier for this asset',
        placeholder: 'e.g., Air Care 1, MICU 2, Ambulance 5',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: 'Asset Type',
      options: [
        { label: 'BLS Ambulance', value: 'bls' },
        { label: 'ALS Ambulance', value: 'als' },
        { label: 'MICU', value: 'micu' },
        { label: 'CCT', value: 'cct' },
        { label: 'Helicopter', value: 'helicopter' },
        { label: 'Chase Vehicle', value: 'chase' },
        { label: 'Support Vehicle', value: 'support' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Type of vehicle or unit',
      },
    },
    {
      name: 'emoji',
      type: 'text',
      label: 'Display Emoji',
      admin: {
        description: 'Emoji to display with this asset (e.g., 🚑, 🚁, 🚓)',
        placeholder: '🚑',
      },
    },
    {
      name: 'unitId',
      type: 'text',
      label: 'Unit ID',
      admin: {
        description: 'Internal unit identifier',
        placeholder: 'e.g., M7-231, CCT-3, SUP-1',
      },
    },
    {
      name: 'licensePlate',
      type: 'text',
      label: 'License Plate',
      admin: {
        description: 'Vehicle license plate number',
        placeholder: 'e.g., EMS-7123',
        condition: (data) => data.type !== 'helicopter',
      },
    },
    {
      name: 'tailNumber',
      type: 'text',
      label: 'Tail Number',
      admin: {
        description: 'Aircraft tail number (helicopters only)',
        placeholder: 'e.g., N123AB',
        condition: (data) => data.type === 'helicopter',
      },
    },
    {
      name: 'capabilities',
      type: 'textarea',
      label: 'Detailed Capabilities',
      admin: {
        description: 'Detailed description of equipment and capabilities (shown in tooltip on hover)',
        placeholder: 'e.g., Bariatric-capable cot, ventilator on board, IABP not mountable',
        rows: 3,
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Internal Notes',
      admin: {
        description: 'Additional internal notes about this asset',
        rows: 2,
      },
    },
  ],
  timestamps: true,
}
