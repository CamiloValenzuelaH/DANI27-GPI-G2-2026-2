import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type NavView = 'process' | 'module';
type UserPlan = 'free' | 'starter' | 'pro' | 'enterprise';

interface LayoutContextType {
  navView: NavView;
  setNavView: (view: NavView) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  userPlan: UserPlan;
  setUserPlan: (plan: UserPlan) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const STORAGE_KEY = 'dani_layout_state';

interface LayoutProviderProps {
  children: ReactNode;
  initialPlan?: UserPlan;
}

export function LayoutProvider({ children, initialPlan = 'free' }: LayoutProviderProps) {
  const [navView, setNavViewState] = useState<NavView>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.navView || 'process';
        } catch (e) {
          return 'process';
        }
      }
    }
    return 'process';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan>(initialPlan);
  const [isLoading, setIsLoading] = useState(true);

  // Helper functions
  const preventMiddleClick = (e: MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      return false;
    }
  };

  // Persist navView to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ navView }));
    }
  }, [navView]);

  // Auto-close sidebar on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1100) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ALWAYS prevent horizontal page scrolling - keep layout static
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Force overflow-x hidden on document element permanently
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.overflowX = 'hidden';

    // Block wheel scroll with horizontal delta ONLY
    const preventHorizontalWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0) {
        e.preventDefault();
        return false;
      }
    };

    // Block middle mouse button (autoscroll feature)
    const preventMiddleClick = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('wheel', preventHorizontalWheel, { passive: false });
    document.addEventListener('mousedown', preventMiddleClick, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventHorizontalWheel);
      document.removeEventListener('mousedown', preventMiddleClick);
    };
  }, []);

  const setNavView = (view: NavView) => {
    setNavViewState(view);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Block horizontal scroll on all overflow elements globally
  useEffect(() => {
    const preventMiddleClick = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        return false;
      }
    };

    const blockHorizontalScrollOnElement = (el: Element) => {
      const htmlEl = el as HTMLElement;
      
      // Block only horizontal wheel scrolling
      htmlEl.addEventListener('wheel', (e: WheelEvent) => {
        if (e.deltaX !== 0) {
          e.preventDefault();
          return false;
        }
      }, { passive: false });
      
      // Block middle mouse button
      htmlEl.addEventListener('mousedown', preventMiddleClick, { passive: false });
    };

    // Apply to existing overflow elements
    const allElements = document.querySelectorAll('[class*="overflow"]');
    allElements.forEach(blockHorizontalScrollOnElement);

    // Observe for new elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const el = node as Element;
              const className = typeof el.className === 'string'
                ? el.className
                : typeof (el as any).className?.baseVal === 'string'
                ? (el as any).className.baseVal
                : '';

              if (className.includes('overflow')) {
                blockHorizontalScrollOnElement(el);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);
  return (
    <LayoutContext.Provider
      value={{
        navView,
        setNavView,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        userPlan,
        setUserPlan,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
