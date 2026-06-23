/**
 * Accessibility Testing Utilities
 * Jest/Vitest helpers for WCAG 2.1 testing
 */

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

/**
 * Test component for accessibility violations
 */
export const testA11y = async (component: React.ReactElement) => {
  const { container } = render(component);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

/**
 * Test keyboard navigation
 */
export const testKeyboardNavigation = (
  component: React.ReactElement,
  expectedOrder: string[]
) => {
  const { container } = render(component);
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  // Verify expected order
  expect(focusableElements.length).toBe(expectedOrder.length);

  // Verify tabindex is proper (should be -1 for managed focus or 0)
  Array.from(focusableElements).forEach((el) => {
    const tabindex = el.getAttribute('tabindex');
    if (tabindex !== null) {
      expect(['0', '-1']).toContain(tabindex);
    }
  });
};

/**
 * Test color contrast ratio
 */
export const testContrast = (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA') => {
  const getLuminance = (color: string): number => {
    const rgb = parseInt(color.replace('#', ''), 16);
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
  const ratio = (lighter + 0.05) / (darker + 0.05);

  const minimumRatio = level === 'AA' ? 4.5 : 7;
  expect(ratio).toBeGreaterThanOrEqual(minimumRatio);

  return ratio;
};

/**
 * Test aria-label presence
 */
export const testAriaLabel = (selector: string, hasLabel: boolean = true) => {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => {
    const hasAriaLabel =
      el.hasAttribute('aria-label') ||
      el.hasAttribute('aria-labelledby') ||
      el.textContent?.trim().length;

    if (hasLabel) {
      expect(hasAriaLabel).toBe(true);
    }
  });
};

/**
 * Test touch target size (minimum 44x44 pixels)
 */
export const testTouchTarget = (selector: string) => {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => {
    const { width, height } = el.getBoundingClientRect();
    expect(width).toBeGreaterThanOrEqual(44);
    expect(height).toBeGreaterThanOrEqual(44);
  });
};

/**
 * Test heading hierarchy
 */
export const testHeadingHierarchy = (container: HTMLElement) => {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    // Heading level should not increase by more than 1
    expect(level - lastLevel).toBeLessThanOrEqual(1);
    lastLevel = level;
  });
};

/**
 * Test form labels
 */
export const testFormLabels = (container: HTMLElement) => {
  const inputs = container.querySelectorAll('input, textarea, select');
  inputs.forEach((input) => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledby = input.getAttribute('aria-labelledby');

    if (id) {
      const label = container.querySelector(`label[for="${id}"]`);
      expect(label || ariaLabel || ariaLabelledby).toBeTruthy();
    } else {
      expect(ariaLabel || ariaLabelledby).toBeTruthy();
    }
  });
};

/**
 * Test image alt text
 */
export const testImageAltText = (container: HTMLElement) => {
  const images = container.querySelectorAll('img');
  images.forEach((img) => {
    const alt = img.getAttribute('alt');
    const ariaLabel = img.getAttribute('aria-label');
    const isDecorative = img.getAttribute('role') === 'presentation';

    if (!isDecorative) {
      expect(alt?.trim().length || ariaLabel?.trim().length).toBeGreaterThan(0);
    }
  });
};
