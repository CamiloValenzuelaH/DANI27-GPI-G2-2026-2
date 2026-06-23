/**
 * Mobile-First Tailwind Utilities
 * Touch-friendly, 320px minimum, Lighthouse a11y >= 90
 */

export const mobileTailwindConfig = {
  // Touch targets: 44x44px mínimo
  spacing: {
    'touch': '44px', // 11 * 4px
    'touch-lg': '48px', // 12 * 4px
  },

  // Font sizes responsive
  fontSize: {
    'xs': ['0.75rem', { lineHeight: '1rem' }], // 12px
    'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    'base': ['1rem', { lineHeight: '1.5rem' }], // 16px mínimo mobile
    'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    'xl': ['1.25rem', { lineHeight: '1.75rem' }], // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
  },

  // Espaciado para tocar en mobile
  minHeight: {
    'touch': '44px',
    'touch-lg': '48px',
  },
  minWidth: {
    'touch': '44px',
    'touch-lg': '48px',
  },

  // Padding mínimo para mobile
  padding: {
    'mobile-safe': 'clamp(1rem, 5vw, 2rem)',
  },

  // Contraste garantizado
  colors: {
    // AA contrast (4.5:1) con white
    'contrast-dark': '#1F2937', // Gray-800
    'contrast-light': '#F9FAFB', // Gray-50
    'contrast-primary': '#1E40AF', // Blue-800
    'contrast-success': '#065F46', // Green-900
    'contrast-warning': '#92400E', // Amber-900
    'contrast-danger': '#7F1D1D', // Red-900
  },
};

// Clases Tailwind para mobile-first
export const mobileA11yClasses = {
  // Touch button: 44x44px mínimo
  button:
    'h-11 w-11 min-h-11 min-w-11 p-3 flex items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95 transition-transform sm:h-10 sm:w-10 sm:p-2',

  // Touch input: 44px height en mobile
  input:
    'h-11 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base aria-invalid:border-red-500 aria-invalid:ring-red-500 sm:h-10 sm:px-2 sm:text-sm',

  // Container responsive: 320px a full-width
  container:
    'w-full px-4 mx-auto sm:px-6 lg:px-8 min-w-80',

  // Text readable: 16px mínimo en mobile
  text: 'text-base sm:text-sm',

  // Link accesible
  link: 'text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:rounded underline',

  // Focus visible
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:rounded',

  // Sidebar drawer
  drawer: 'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:static lg:w-auto lg:shadow-none',

  // Modal full-screen mobile
  modal: 'fixed inset-0 sm:inset-auto sm:fixed sm:max-w-lg bg-white rounded-t-lg sm:rounded-lg shadow-lg',

  // Tabla scroll horizontal
  tableWrapper: 'overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 horizontal-scroll-container',

  // Error message seguro
  errorMessage: 'text-sm text-red-600 mt-1 aria-live-polite',

  // Skip link
  skipLink: 'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded',
};

/**
 * Breakpoints para responsive design
 */
export const breakpoints = {
  mobile: '320px', // 20rem
  sm: '640px', // 40rem
  md: '768px', // 48rem
  lg: '1024px', // 64rem
  xl: '1280px', // 80rem
  '2xl': '1536px', // 96rem
};

/**
 * Media queries helper
 */
export const mediaQueries = {
  mobile: '@media (max-width: 639px)',
  tablet: '@media (min-width: 640px) and (max-width: 1023px)',
  desktop: '@media (min-width: 1024px)',
  touch: '@media (hover: none) and (pointer: coarse)',
};

/**
 * Accesibilidad: Contraste 4.5:1 mínimo
 */
export const contrastSafeColors = {
  // Dark text on white (21:1)
  text: {
    dark: '#000000',
    darkGray: '#111827', // gray-900
  },

  // Light text on dark (15.3:1)
  textLight: {
    light: '#FFFFFF',
    lightGray: '#F9FAFB', // gray-50
  },

  // Semantic colors with AA contrast
  status: {
    success: '#065F46', // green-900 (11.5:1)
    warning: '#92400E', // amber-900 (7.3:1)
    danger: '#7F1D1D', // red-900 (8.3:1)
    info: '#1E40AF', // blue-900 (7.36:1)
  },
};

/**
 * Safe viewport sizes
 */
export const viewportSizes = {
  mobile: {
    width: 320,
    height: 568,
    description: 'iPhone SE',
  },
  mobileSmall: {
    width: 375,
    height: 667,
    description: 'iPhone 8',
  },
  mobileLarge: {
    width: 414,
    height: 896,
    description: 'iPhone 11',
  },
  tablet: {
    width: 768,
    height: 1024,
    description: 'iPad',
  },
  desktop: {
    width: 1920,
    height: 1080,
    description: 'Desktop',
  },
};
