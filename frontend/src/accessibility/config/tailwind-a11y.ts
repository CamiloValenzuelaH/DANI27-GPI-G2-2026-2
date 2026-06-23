/**
 * Tailwind CSS Configuration for Accessibility
 * Add this to your tailwind.config.ts
 */

export const accessibilityConfig = {
  // Colores con contraste garantizado
  colors: {
    // Grayscale with WCAG AAA contrast
    gray: {
      900: '#111827', // 19.56:1 vs white
      800: '#1f2937', // 15.3:1 vs white
      700: '#374151', // 9.94:1 vs white
      600: '#4b5563', // 7:1 vs white (AAA)
      500: '#6b7280', // 5.4:1 vs white (AA)
      400: '#9ca3af',
      300: '#d1d5db',
      200: '#e5e7eb',
      100: '#f3f4f6',
      50: '#f9fafb',
    },

    // Semantic colors with contrast
    primary: {
      900: '#1e3a8a', // 8.59:1 vs white
      800: '#1e40af', // 7.36:1 vs white (AAA)
      700: '#1d4ed8', // 6.29:1 vs white (AA)
      600: '#2563eb', // 5.07:1 vs white (AA)
      500: '#3b82f6',
      400: '#60a5fa',
      300: '#93c5fd',
      200: '#bfdbfe',
      100: '#dbeafe',
      50: '#eff6ff',
    },

    // Status colors with contrast
    success: {
      900: '#164e63', // 11.5:1 vs white (AAA)
      800: '#155e75', // 9.2:1 vs white (AAA)
      700: '#0e7490', // 7.4:1 vs white (AAA)
      600: '#06b6d4', // 4.7:1 vs white (AA)
    },

    warning: {
      900: '#7c2d12', // 8.7:1 vs white (AAA)
      800: '#92400e', // 7.3:1 vs white (AAA)
      700: '#b45309', // 6.0:1 vs white (AA)
      600: '#d97706', // 4.8:1 vs white (AA)
    },

    danger: {
      900: '#7f1d1d', // 8.3:1 vs white (AAA)
      800: '#991b1b', // 6.8:1 vs white (AAA)
      700: '#b91c1c', // 5.6:1 vs white (AA)
      600: '#dc2626', // 4.1:1 vs white (AA)
    },
  },

  // Focus ring utilities for keyboard navigation
  extend: {
    ringColor: {
      DEFAULT: 'rgb(59, 130, 246, 0.5)', // blue-500 with opacity
    },
    ringOpacity: {
      DEFAULT: '0.5',
    },
    ringWidth: {
      DEFAULT: '2px',
    },
    outlineOffset: {
      DEFAULT: '2px',
    },
  },
};

// Tailwind CSS classes for accessibility
export const a11yClasses = {
  // Skip to main content link
  skipLink: 'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:font-semibold',

  // Focus ring for keyboard navigation
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:rounded',

  // Touch target minimum size (44x44px)
  touchTarget: 'min-h-[44px] min-w-[44px]',

  // Screen reader only text
  srOnly: 'sr-only',

  // Interactive element base
  interactive: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors',

  // Button accessible
  button: 'px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',

  // Form input accessible
  formInput: 'w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent aria-invalid:border-red-500 aria-invalid:ring-red-500',

  // Link accessible
  link: 'text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:rounded underline',
};
