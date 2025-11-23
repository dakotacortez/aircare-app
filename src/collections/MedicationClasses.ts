import type { CollectionConfig } from 'payload'
import { isContentTeamOrAdmin } from '../access/isContentTeamOrAdmin'
import { isAdmin } from '../access/isAdmin'

export const MedicationClasses: CollectionConfig = {
  slug: 'medication-classes',
  labels: {
    singular: 'Medication Class',
    plural: 'Medication Classes',
  },
  admin: {
    useAsTitle: 'name',
    group: 'Clinical Content',
    description: 'Manage the drug class categories that can be attached to medications.',
    defaultColumns: ['name', 'slug', 'updatedAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.status !== 'active') return false
      if (user.role === 'content-team' || user.role === 'admin-team') {
        return true
      }
      if (user.role === 'user' && user.approved) {
        return true
      }
      return false
    },
    create: isContentTeamOrAdmin,
    update: isContentTeamOrAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Class Name',
      admin: {
        placeholder: 'e.g., Vasopressor, Antiarrhythmic',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Identifier',
      admin: {
        description: 'Used as the stable identifier for filtering or integrations (e.g., vasopressor).',
        placeholder: 'e.g., vasopressor',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Optional context for when to use this class.',
      },
    },
  ],
}
