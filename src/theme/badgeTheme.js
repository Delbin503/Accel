/**
 * Badge Theme Configuration
 *
 * This file contains global badge variant definitions that can be used throughout the app.
 * Add custom project-specific badge variants here to maintain consistency.
 *
 * Usage:
 * import { badgeTheme } from 'theme/badgeTheme';
 * <Badge variant="brand">Content</Badge>
 */

export const badgeTheme = {
  variants: {
    // Brand/Primary variant - FedEx colors
    brand: {
      solid: 'bg-gradient-to-r from-brand to-brand-dark text-white',
      border: 'border border-brand text-brand bg-transparent',
      soft: 'bg-brand/10 border border-brand/30 text-brand',
      outline: 'border-2 border-brand text-brand bg-transparent',
      text: 'text-brand',
      dotColor: 'bg-brand',
    },

    // FedEx variant - Purple brand color
    fedex: {
      solid: 'bg-deep-purple text-white',
      border: 'border border-deep-purple text-deep-purple bg-transparent',
      soft: 'bg-deep-purple/10 border border-deep-purple/30 text-deep-purple',
      outline: 'border-2 border-deep-purple text-deep-purple bg-transparent',
      text: 'text-deep-purple',
      dotColor: 'bg-deep-purple',
    },

    // VIP/Premium variant - Gold
    vip: {
      solid: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold',
      border: 'border-2 border-yellow-400 text-yellow-600 font-bold',
      soft: 'bg-yellow-50 border border-yellow-300 text-yellow-700 font-bold',
      outline: 'border-2 border-yellow-500 text-yellow-600 font-bold',
      text: 'text-yellow-600 font-bold',
      dotColor: 'bg-yellow-500',
    },

    // Pink variant
    pink: {
      solid: 'bg-pink-100 text-pink-600',
      border: 'border border-pink-500 text-pink-500 bg-transparent',
      soft: 'bg-pink-50 border border-pink-300 text-pink-600',
      outline: 'border-2 border-pink-500 text-pink-500 bg-transparent',
      text: 'text-pink-500',
      dotColor: 'bg-pink-500',
    },

    // Purple variant
    purple: {
      solid: 'bg-purple-100 text-purple-600',
      border: 'border border-purple-500 text-purple-500 bg-transparent',
      soft: 'bg-purple-50 border border-purple-300 text-purple-600',
      outline: 'border-2 border-purple-500 text-purple-500 bg-transparent',
      text: 'text-purple-500',
      dotColor: 'bg-purple-500',
    },

    // Teal variant
    teal: {
      solid: 'bg-teal-100 text-teal-600',
      border: 'border border-teal-500 text-teal-500 bg-transparent',
      soft: 'bg-teal-50 border border-teal-300 text-teal-600',
      outline: 'border-2 border-teal-500 text-teal-500 bg-transparent',
      text: 'text-teal-500',
      dotColor: 'bg-teal-500',
    },

    // Add more custom variants here as needed
  },

  // Custom status mapping (optional)
  // Maps status text to variant names
  customStatusMap: {
    'premium': 'vip',
    'express': 'brand',
    'fedex-service': 'fedex',
  },
};

export default badgeTheme;
