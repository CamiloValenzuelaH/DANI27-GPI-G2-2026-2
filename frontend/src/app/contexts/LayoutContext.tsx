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

  const setNavView = (view: NavView) => {
    setNavViewState(view);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

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
