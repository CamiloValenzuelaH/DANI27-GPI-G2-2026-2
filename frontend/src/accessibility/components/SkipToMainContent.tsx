/**
 * Accessible Skip to Main Content Link
 * WCAG 2.1 - Standard practice for accessibility
 */

import React from 'react';

interface SkipToMainProps {
  mainContentId?: string;
  label?: string;
}

export const SkipToMainContent: React.FC<SkipToMainProps> = ({
  mainContentId = 'main-content',
  label = 'Skip to main content',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById(mainContentId);
    if (mainContent) {
      mainContent.focus();
      mainContent.tabIndex = -1;
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${mainContentId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {label}
    </a>
  );
};
