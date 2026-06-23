/**
 * Accessibility Hooks for React
 * WCAG 2.1 compliant patterns and utilities
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createAriaId, announceToScreenReader, createFocusTrap } from '../utils/a11y-helpers';

/**
 * Hook for managing focus on modal/dialog open
 * Restores focus when dialog closes
 */
export const useFocusManagement = (isOpen: boolean) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  return previousActiveElement;
};

/**
 * Hook for creating a focus trap within a container
 * Useful for modals, popovers, and dialogs
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

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
  }, [isActive]);

  return containerRef;
};

/**
 * Hook for announcing messages to screen readers
 */
export const useAnnouncement = () => {
  return useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }, []);
};

/**
 * Hook for generating unique ARIA IDs
 */
export const useAriaId = (prefix: string, id?: string | number) => {
  const [ariaId] = useState(() => createAriaId(prefix, id));
  return ariaId;
};

/**
 * Hook for listening to keyboard events with accessibility in mind
 */
export const useKeyboardNavigation = (
  onEnter?: () => void,
  onEscape?: () => void,
  onTab?: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && onEnter) onEnter();
      if (event.key === 'Escape' && onEscape) onEscape();
      if (event.key === 'Tab' && onTab) onTab();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, onEscape, onTab]);
};

/**
 * Hook for detecting reduced motion preference
 * Useful for disabling animations for users who prefer it
 */
export const useReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
};

/**
 * Hook for detecting color scheme preference (dark/light mode)
 */
export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return colorScheme;
};

/**
 * Hook for detecting high contrast preference
 */
export const useHighContrast = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
};

/**
 * Hook for managing aria-expanded state
 */
export const useAriaExpanded = (initialState: boolean = false) => {
  const [isExpanded, setIsExpanded] = useState(initialState);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return {
    isExpanded,
    toggle,
    ariaExpanded: isExpanded,
    setIsExpanded,
  };
};

/**
 * Hook for managing aria-selected state
 */
export const useAriaSelected = (initialState: boolean = false) => {
  const [isSelected, setIsSelected] = useState(initialState);

  return {
    isSelected,
    setIsSelected,
    ariaSelected: isSelected,
  };
};

/**
 * Hook for managing focus visible state (for keyboard navigation indicators)
 */
export const useFocusVisible = () => {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseDown = () => setIsFocusVisible(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') setIsFocusVisible(true);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return { isFocusVisible, ref };
};

/**
 * Hook for managing aria-disabled state
 */
export const useAriaDisabled = (isDisabled: boolean) => {
  return {
    ariaDisabled: isDisabled,
    'aria-disabled': isDisabled,
  };
};
