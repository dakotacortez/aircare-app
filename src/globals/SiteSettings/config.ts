import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'
import { revalidateSiteSettings } from './hooks/revalidateSiteSettings'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true,
    update: isAdmin, // Only Admin Team can update site settings
  },
  fields: [
    // Branding Section
    {
      type: 'collapsible',
      label: 'Branding',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'siteName',
          type: 'text',
          label: 'Site Name',
          required: true,
          defaultValue: 'AirCare Protocol Hub',
          admin: {
            description: 'The name of your organization',
          },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo',
          admin: {
            description: 'Site logo displayed in header (recommended: SVG or PNG with transparent background)',
          },
        },
        {
          name: 'favicon',
          type: 'upload',
          relationTo: 'media',
          label: 'Favicon',
          admin: {
            description: 'Browser tab icon (recommended: 32x32 PNG or ICO)',
          },
        },
      ],
    },

    // Hero Section
    {
      type: 'collapsible',
      label: 'Hero Section',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'heroBackgroundImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Hero Background Image',
          admin: {
            description: 'Optional background image for the hero section',
          },
        },
        {
          name: 'heroBadgeText',
          type: 'text',
          label: 'Hero Badge Text',
          defaultValue: 'Trusted by 107+ Licensed Clinicians',
          admin: {
            description: 'Small badge text above the main headline',
          },
        },
        {
          name: 'heroTitle',
          type: 'textarea',
          label: 'Hero Title',
          required: true,
          defaultValue: 'One hub for protocols, checklists, and calculators — offline‑ready',
          admin: {
            description: 'Main headline on the homepage',
          },
        },
        {
          name: 'heroHighlight',
          type: 'text',
          label: 'Hero Highlight Word',
          defaultValue: 'offline‑ready',
          admin: {
            description: 'Word or phrase to highlight in red (must appear in hero title)',
          },
        },
        {
          name: 'heroSubtitle',
          type: 'textarea',
          label: 'Hero Subtitle',
          required: true,
          defaultValue: 'Designed for CCT and ALS/BLS teams with fast search, pediatric/OB pathways, and admin‑friendly updates. Access critical care protocols anywhere, anytime.',
          admin: {
            description: 'Subtitle text below the headline',
          },
        },
        {
          name: 'heroPrimaryButtonText',
          type: 'text',
          label: 'Primary Button Text',
          defaultValue: 'Open Protocols',
        },
        {
          name: 'heroPrimaryButtonLink',
          type: 'text',
          label: 'Primary Button Link',
          defaultValue: '/protocols',
        },
        {
          name: 'heroSecondaryButtonText',
          type: 'text',
          label: 'Secondary Button Text',
          defaultValue: 'Download App',
        },
        {
          name: 'heroSecondaryButtonLink',
          type: 'text',
          label: 'Secondary Button Link',
          admin: {
            description: 'Optional link for secondary button',
          },
        },
        {
          name: 'heroGradientTopOpacity',
          type: 'number',
          label: 'Gradient Top Opacity',
          defaultValue: 60,
          min: 0,
          max: 100,
          admin: {
            description: 'Opacity at the top of the gradient overlay (0-100)',
          },
        },
        {
          name: 'heroGradientMidOpacity',
          type: 'number',
          label: 'Gradient Middle Opacity',
          defaultValue: 80,
          min: 0,
          max: 100,
          admin: {
            description: 'Opacity at the middle of the gradient overlay (0-100)',
          },
        },
        {
          name: 'heroGradientBottomOpacity',
          type: 'number',
          label: 'Gradient Bottom Opacity',
          defaultValue: 100,
          min: 0,
          max: 100,
          admin: {
            description: 'Opacity at the bottom of the gradient overlay (0-100)',
          },
        },
        {
          name: 'heroGradientColor',
          type: 'select',
          label: 'Gradient Color',
          defaultValue: 'black',
          options: [
            { label: 'Black', value: 'black' },
            { label: 'Navy', value: 'navy' },
            { label: 'Dark Blue', value: 'darkblue' },
            { label: 'Dark Gray', value: 'darkgray' },
          ],
          admin: {
            description: 'Base color for the gradient overlay',
          },
        },
      ],
    },

    // Stats Section
    {
      type: 'collapsible',
      label: 'Stats Section',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'stats',
          type: 'array',
          label: 'Statistics',
          maxRows: 4,
          fields: [
            {
              name: 'number',
              type: 'text',
              label: 'Number',
              required: true,
              admin: {
                placeholder: 'e.g., 107+',
              },
            },
            {
              name: 'label',
              type: 'text',
              label: 'Label',
              required: true,
              admin: {
                placeholder: 'e.g., Licensed Clinicians',
              },
            },
          ],
          defaultValue: [
            { number: '107+', label: 'Licensed Clinicians' },
            { number: '44+', label: 'Certification Types' },
            { number: '3-State', label: 'Coverage Area' },
            { number: '24/7', label: 'Critical Care Ready' },
          ],
        },
      ],
    },

    // Features Section
    {
      type: 'collapsible',
      label: 'Features Section',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'featuresTitle',
          type: 'text',
          label: 'Section Title',
          defaultValue: 'Everything you need in the field',
        },
        {
          name: 'featuresSubtitle',
          type: 'textarea',
          label: 'Section Subtitle',
          defaultValue: 'Built specifically for critical care transport teams. Fast, reliable, and works offline.',
        },
      ],
    },

    // CTA Section
    {
      type: 'collapsible',
      label: 'Call to Action Section',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'ctaTitle',
          type: 'text',
          label: 'CTA Title',
          defaultValue: 'Ready for your next transport?',
        },
        {
          name: 'ctaSubtitle',
          type: 'text',
          label: 'CTA Subtitle',
          defaultValue: 'Access protocols, calculators, and checklists — anywhere, anytime.',
        },
        {
          name: 'ctaPrimaryButtonText',
          type: 'text',
          label: 'Primary Button Text',
          defaultValue: 'Open Protocols',
        },
        {
          name: 'ctaSecondaryButtonText',
          type: 'text',
          label: 'Secondary Button Text',
          defaultValue: 'Download App',
        },
      ],
    },

    // Contact & Social
    {
      type: 'collapsible',
      label: 'Contact & Social Media',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'contactEmail',
          type: 'email',
          label: 'Contact Email',
          admin: {
            description: 'General contact email address',
          },
        },
        {
          name: 'contactPhone',
          type: 'text',
          label: 'Contact Phone',
          admin: {
            description: 'Contact phone number',
          },
        },
        {
          name: 'socialLinks',
          type: 'array',
          label: 'Social Media Links',
          maxRows: 6,
          fields: [
            {
              name: 'platform',
              type: 'select',
              label: 'Platform',
              required: true,
              options: [
                { label: 'Facebook', value: 'facebook' },
                { label: 'Twitter/X', value: 'twitter' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'YouTube', value: 'youtube' },
                { label: 'GitHub', value: 'github' },
              ],
            },
            {
              name: 'url',
              type: 'text',
              label: 'URL',
              required: true,
            },
          ],
        },
      ],
    },

    // SEO
    {
      type: 'collapsible',
      label: 'SEO & Metadata',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: 'Default Meta Title',
          admin: {
            description: 'Default title for pages without a specific meta title',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Default Meta Description',
          maxLength: 160,
          admin: {
            description: 'Default description for search engines (160 characters max)',
          },
        },
        {
          name: 'metaImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Default Social Share Image',
          admin: {
            description: 'Default image for social media shares (recommended: 1200x630px)',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateSiteSettings],
  },
}
