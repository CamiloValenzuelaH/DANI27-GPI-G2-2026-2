/**
 * Accessibility Module - Main Exports
 */

// Components
export { MobileOptimizedDrawer } from './components/MobileOptimized';
export { useCloseOnNavigation } from './hooks/useMobileViewport';

// Hooks
export {
  useFocusManagement,
  useFocusTrap,
  useAnnouncement,
  useAriaId,
  useKeyboardNavigation,
  useReducedMotion,
  useColorScheme,
  useHighContrast,
  useAriaExpanded,
  useAriaSelected,
  useFocusVisible,
  useAriaDisabled,
} from './hooks/useA11y';

// Helpers
export {
  createAriaId,
  isElementVisible,
  announceToScreenReader,
  createFocusTrap,
  getContrastRatio,
  contrastCompliance,
  skipToMainAttrs,
  handleArrowKeyNavigation,
  iconButtonLabel,
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
  escapeHtml,
} from './utils/a11y-helpers';

