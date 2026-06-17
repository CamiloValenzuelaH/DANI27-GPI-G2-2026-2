/**
 * Accessibility Module - Main Exports
 */

// Components
export { SkipToMainContent } from './components/SkipToMainContent';
export { AccessibleModal } from './components/AccessibleModal';
export { AccessibleDropdown } from './components/AccessibleDropdown';
export { AccessibleTabs, type TabItem } from './components/AccessibleTabs';
export { ResponsiveProvider, useResponsive, type BreakpointType } from './components/ResponsiveProvider';

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

// Audit
export { accessibilityAudit, getAuditSummary, findingsByComponent, findingsByLevel } from './audit/audit-report';

// Tests
export {
  testA11y,
  testKeyboardNavigation,
  testContrast,
  testAriaLabel,
  testTouchTarget,
  testHeadingHierarchy,
  testFormLabels,
  testImageAltText,
} from './tests/a11y-test-utils';
