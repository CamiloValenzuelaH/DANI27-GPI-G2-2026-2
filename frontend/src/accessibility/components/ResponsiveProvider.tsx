/**
 * Responsive Layout Provider
 * Handles mobile, tablet, and desktop breakpoints
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

export type BreakpointType = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveContextType {
  breakpoint: BreakpointType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(
  undefined
);

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

export const ResponsiveProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [breakpoint, setBreakpoint] = useState<BreakpointType>('desktop');
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (screenWidth < BREAKPOINTS.tablet) {
      setBreakpoint('mobile');
    } else if (screenWidth < BREAKPOINTS.desktop) {
      setBreakpoint('tablet');
    } else {
      setBreakpoint('desktop');
    }
  }, [screenWidth]);

  const value: ResponsiveContextType = {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    screenWidth,
  };

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = (): ResponsiveContextType => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveProvider');
  }
  return context;
};
