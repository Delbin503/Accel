import React from 'react';
import { cn } from 'utils/common';

// Import global theme (will be created next)
let badgeTheme = { variants: {} };
try {
  const theme = require('theme/badgeTheme');
  badgeTheme = theme.badgeTheme || { variants: {} };
} catch (e) {
  // Theme file not yet created, use empty object
}

// Status auto-mapping dictionary
const STATUS_VARIANT_MAP = {
  // Success states (Green)
  'live': 'success',
  'online': 'success',
  'active': 'success',
  'connected': 'success',
  'recording': 'success',
  'verified': 'success',
  'completed': 'success',
  'success': 'success',
  'approved': 'success',
  'enabled': 'success',

  // Error states (Red)
  'offline': 'error',
  'disconnected': 'error',
  'failed': 'error',
  'error': 'error',
  'inactive': 'error',
  'rejected': 'error',
  'cancelled': 'error',
  'storage full': 'error',
  'critical': 'error',
  'disabled': 'error',

  // Warning states (Yellow)
  'warning': 'warning',
  'not recording': 'warning',
  'pending': 'warning',
  'scheduled off': 'warning',
  'maintenance': 'warning',
  'limited': 'warning',
  'partial': 'warning',

  // Info states (Blue)
  'available': 'info',
  'info': 'info',
  'scheduled': 'info',
  'processing': 'info',
  'in progress': 'info',
  'queued': 'info',

  // Default states (Gray)
  'not configured': 'default',
  'unknown': 'default',
  'n/a': 'default',
  'none': 'default',
  'empty': 'default',
};

const Badge = ({
  // Core props
  variant = 'default',
  appearance = 'solid',  // Renamed from 'style' to avoid React style prop conflict
  size = 'sm',

  // Icon props
  icon = null,
  dot = false,
  iconPosition = 'left',

  // Text customization
  textColor = null,
  textSize = null,
  textWeight = 'medium',
  textTransform = 'capitalize',

  // Color customization
  bgColor = null,
  borderColor = null,
  borderWidth = '1',

  // Shape
  rounded = 'full',

  // Custom variants
  customVariants = null,

  // Auto-mapping
  autoMap = false,
  statusMap = null,

  // Utility
  className = '',
  unstyled = false,

  // Content
  children,
  ...props
}) => {
  // Auto-map status text to variant if enabled
  let finalVariant = variant;
  if (autoMap && typeof children === 'string') {
    const statusText = children.toLowerCase();
    const customMap = statusMap || {};
    finalVariant = customMap[statusText] || STATUS_VARIANT_MAP[statusText] || variant;
  }

  // If unstyled, return minimal wrapper
  if (unstyled) {
    return (
      <span className={className} {...props}>
        {children}
      </span>
    );
  }

  // Built-in color variants
  const builtInVariants = {
    success: {
      solid: 'bg-green-500/20 text-green-500',
      border: 'border border-green-500 text-green-500 bg-transparent',
      soft: 'bg-green-500/10 border border-green-500/30 text-green-500',
      outline: 'border-2 border-green-500 text-green-500 bg-transparent',
      text: 'text-green-500',
      dotColor: 'bg-green-500',
    },
    error: {
      solid: 'bg-red-500/20 text-red-500',
      border: 'border border-red-500 text-red-500 bg-transparent',
      soft: 'bg-red-500/10 border border-red-500/30 text-red-500',
      outline: 'border-2 border-red-500 text-red-500 bg-transparent',
      text: 'text-red-500',
      dotColor: 'bg-red-500',
    },
    warning: {
      solid: 'bg-yellow-500/20 text-yellow-500',
      border: 'border border-yellow-500 text-yellow-500 bg-transparent',
      soft: 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500',
      outline: 'border-2 border-yellow-500 text-yellow-500 bg-transparent',
      text: 'text-yellow-500',
      dotColor: 'bg-yellow-500',
    },
    info: {
      solid: 'bg-blue-500/20 text-blue-500',
      border: 'border border-blue-500 text-blue-500 bg-transparent',
      soft: 'bg-blue-500/10 border border-blue-500/30 text-blue-500',
      outline: 'border-2 border-blue-500 text-blue-500 bg-transparent',
      text: 'text-blue-500',
      dotColor: 'bg-blue-500',
    },
    default: {
      solid: 'bg-gray-500/20 text-gray-500',
      border: 'border border-gray-500 text-gray-500 bg-transparent',
      soft: 'bg-gray-500/10 border border-gray-500/30 text-gray-500',
      outline: 'border-2 border-gray-500 text-gray-500 bg-transparent',
      text: 'text-gray-500',
      dotColor: 'bg-gray-500',
    },
    // Backward compatibility - severity levels
    high: {
      solid: 'bg-badge-high/20 text-red-300',
      border: 'border border-red-500 text-red-500 bg-transparent',
      soft: 'bg-badge-high/10 border border-badge-high/30 text-red-300',
      outline: 'border-2 border-red-500 text-red-300 bg-transparent',
      text: 'text-red-300',
      dotColor: 'bg-red-500',
    },
    medium: {
      solid: 'bg-accent-fire/10 text-yellow-300',
      border: 'border border-yellow-500 text-yellow-500 bg-transparent',
      soft: 'bg-accent-fire/10 border border-accent-fire/30 text-yellow-300',
      outline: 'border-2 border-yellow-500 text-yellow-300 bg-transparent',
      text: 'text-yellow-300',
      dotColor: 'bg-yellow-500',
    },
    low: {
      solid: 'bg-badge-low/12 text-green-300',
      border: 'border border-green-500 text-green-500 bg-transparent',
      soft: 'bg-badge-low/10 border border-badge-low/30 text-green-300',
      outline: 'border-2 border-green-500 text-green-300 bg-transparent',
      text: 'text-green-300',
      dotColor: 'bg-green-500',
    },
  };

  // Merge variants with priority: custom > theme > built-in
  const allVariants = {
    ...builtInVariants,
    ...badgeTheme.variants,
    ...customVariants,
  };

  // Size definitions
  const sizes = {
    xs: {
      text: 'text-[10px]',
      padding: 'px-2 py-0.5',
      iconSize: 'w-2 h-2',
      dotSize: 'w-1.5 h-1.5',
      gap: 'gap-1',
    },
    sm: {
      text: 'text-xs',
      padding: 'px-3 py-1',
      iconSize: 'w-3 h-3',
      dotSize: 'w-2 h-2',
      gap: 'gap-1.5',
    },
    md: {
      text: 'text-sm',
      padding: 'px-4 py-1.5',
      iconSize: 'w-4 h-4',
      dotSize: 'w-2.5 h-2.5',
      gap: 'gap-2',
    },
    lg: {
      text: 'text-base',
      padding: 'px-5 py-2',
      iconSize: 'w-5 h-5',
      dotSize: 'w-3 h-3',
      gap: 'gap-2',
    },
  };

  // Rounded styles
  const roundedStyles = {
    full: 'rounded-full',
    lg: 'rounded-lg',
    md: 'rounded-md',
    sm: 'rounded-sm',
  };

  // Text weight classes
  const textWeights = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  // Text transform classes
  const textTransforms = {
    capitalize: 'capitalize',
    uppercase: 'uppercase',
    lowercase: 'lowercase',
    none: 'normal-case',
  };

  // Border width classes
  const borderWidths = {
    '1': 'border',
    '2': 'border-2',
    '3': 'border-[3px]',
  };

  // Get variant colors (used if no manual colors provided)
  const variantColors = allVariants[finalVariant]?.[appearance] || allVariants.default?.[appearance] || '';
  const dotColorClass = allVariants[finalVariant]?.dotColor || allVariants.default?.dotColor;

  // Determine if manual colors are provided
  const hasManualColors = textColor || bgColor || borderColor;

  // Size classes
  const sizeClasses = sizes[size] || sizes.sm;
  const roundedClass = roundedStyles[rounded];

  return (
    <span
      className={cn(
        'inline-flex items-center',

        // Colors: manual overrides variant
        hasManualColors ? cn(textColor, bgColor, borderColor) : variantColors,

        // Border width (for border/soft/outline appearances)
        (appearance === 'border' || appearance === 'soft' || appearance === 'outline') && !borderColor && borderWidths[borderWidth],
        (appearance === 'border' || appearance === 'soft' || appearance === 'outline') && borderColor && borderWidths[borderWidth],

        // Text styling
        textSize || sizeClasses.text,
        textWeights[textWeight],
        textTransforms[textTransform],

        // Padding & shape (not for text appearance)
        appearance !== 'text' && sizeClasses.padding,
        appearance !== 'text' && roundedClass,

        // Icon/dot spacing
        (icon || dot) && sizeClasses.gap,

        // Custom classes
        className
      )}
      {...props}
    >
      {/* Dot indicator - left side */}
      {dot && iconPosition === 'left' && (
        <span
          className={cn(
            'rounded-full flex-shrink-0',
            sizeClasses.dotSize,
            dotColorClass
          )}
        />
      )}

      {/* Custom icon - left side */}
      {icon && iconPosition === 'left' && (
        <span className={cn('flex-shrink-0', sizeClasses.iconSize)}>
          {icon}
        </span>
      )}

      {/* Content */}
      {children}

      {/* Custom icon - right side */}
      {icon && iconPosition === 'right' && (
        <span className={cn('flex-shrink-0', sizeClasses.iconSize)}>
          {icon}
        </span>
      )}

      {/* Dot indicator - right side */}
      {dot && iconPosition === 'right' && (
        <span
          className={cn(
            'rounded-full flex-shrink-0',
            sizeClasses.dotSize,
            dotColorClass
          )}
        />
      )}
    </span>
  );
};

export default Badge;
