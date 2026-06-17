/**
 * WCAG 2.1 Accessibility Helpers
 * Utilities for creating accessible, WCAG-compliant components
 */

/**
 * Generate unique ARIA IDs to link elements together
 */
export const createAriaId = (prefix: string, id?: string | number): string => {
  const uniqueId = id || Math.random().toString(36).substr(2, 9);
  return `${prefix}-${uniqueId}`;
};

/**
 * Check if element is visible (not hidden, display: none, visibility: hidden)
 */
export const isElementVisible = (element: HTMLElement): boolean => {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    element.offsetParent !== null
  );
};

/**
 * Announce messages to screen readers using aria-live
 * Usage: announceToScreenReader("Item added to favorites")
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
  duration = 3000
): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    announcement.remove();
  }, duration);
};

/**
 * Focus trap for modals and dialogs
 * Keeps keyboard focus within the component
 */
export const createFocusTrap = (
  containerRef: React.RefObject<HTMLElement>
): (() => void) => {
  return () => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleKeyDown);

    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  };
};

/**
 * Check color contrast ratio (WCAG compliance)
 * AAA: >= 7:1, AA: >= 4.5:1
 */
export const getContrastRatio = (
  foreground: string,
  background: string
): number => {
  const getLuminance = (color: string): number => {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const luminance = [r, g, b].map((x) => {
      x = x / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * luminance[0] + 0.7152 * luminance[1] + 0.0722 * luminance[2];
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * WCAG Contrast Compliance Levels
 */
export const contrastCompliance = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
};

/**
 * Skip to main content link helper
 * Returns object with className and attributes for a11y skip link
 */
export const skipToMainAttrs = () => ({
  href: '#main-content',
  className: 'sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-blue-600 focus:text-white',
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  },
});

/**
 * Keyboard navigation helper
 * Handles arrow key navigation for lists/grids
 */
export const handleArrowKeyNavigation = (
  event: React.KeyboardEvent<HTMLElement>,
  items: HTMLElement[],
  currentIndex: number,
  direction: 'vertical' | 'horizontal' = 'vertical'
): number => {
  if (items.length === 0) return currentIndex;

  let nextIndex = currentIndex;

  if (direction === 'vertical') {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    }
  } else {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    }
  }

  items[nextIndex]?.focus();
  return nextIndex;
};

/**
 * Generate accessible label for icon-only buttons
 */
export const iconButtonLabel = (icon: string, action: string): string => {
  const actions: Record<string, Record<string, string>> = {
    close: { 'X': 'Close dialog', 'times': 'Close', 'x-mark': 'Close' },
    menu: { 'bars': 'Open menu', 'menu': 'Open menu' },
    search: { 'search': 'Search', 'magnifying-glass': 'Search' },
    settings: { 'cog': 'Open settings', 'settings': 'Settings' },
    delete: { 'trash': 'Delete item', 'delete': 'Delete' },
    edit: { 'pencil': 'Edit item', 'edit': 'Edit' },
    download: { 'download': 'Download file' },
    upload: { 'upload': 'Upload file' },
  };

  return actions[action]?.[icon] || `${action} ${icon}`;
};

/**
 * Reduce motion preference (respects prefers-reduced-motion)
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * High contrast preference (respects prefers-contrast)
 */
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: more)').matches;
};

/**
 * Dark mode preference (respects prefers-color-scheme)
 */
export const prefersDarkMode = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Escape HTML to prevent XSS in ARIA labels
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};
