import { useLocation, useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useLayout } from '../contexts/LayoutContext';
import {
  processMenuItems,
  intelligenceMenuItems,
  coreModulesItems,
  regulatoryModulesItems,
  settingsItems,
  hasAccess,
  getRequiredPlanName,
  MenuItem,
} from '../config/menuConfig';
import { Lock, X } from 'lucide-react';
import { MobileOptimizedDrawer } from '@/accessibility/components/MobileOptimized';
import { useCloseOnNavigation } from '@/accessibility/hooks/useMobileViewport';

interface SidebarProps {
  profile: 'foundational' | 'established' | 'advanced' | 'mature';
  onProfileClick: () => void;
  darkMode: boolean;
}

export default function SidebarPro({ profile, onProfileClick, darkMode }: SidebarProps) {
  const { navView, setNavView, isSidebarOpen, toggleSidebar, userPlan } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const intl = useIntl();

  const profileConfig = {
    foundational: { color: 'bg-[#F5A623]/15 text-[#F5A623]', dot: 'bg-[#F5A623]', label: 'Foundational' },
    established: { color: 'bg-[#4F6EF7]/15 text-[#8BA3F9]', dot: 'bg-[#8BA3F9]', label: 'Established' },
    advanced: { color: 'bg-[#8B5CF6]/15 text-[#B794F6]', dot: 'bg-[#B794F6]', label: 'Advanced' },
    mature: { color: 'bg-[#1DB954]/15 text-[#1DB954]', dot: 'bg-[#1DB954]', label: 'Mature' },
  };

  const isPathActive = (itemPath: string) => {
    if (itemPath === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(itemPath);
  };

  const drawerTitle = intl.formatMessage({ id: 'sidebar.menu', defaultMessage: 'Menú' });

  const handleNavigation = (item: MenuItem) => {
    if (hasAccess(item.requiredPlan, userPlan)) {
      navigate(item.path);
      if (window.innerWidth < 1100) {
        toggleSidebar();
      }
    }
  };

  useCloseOnNavigation(isSidebarOpen, toggleSidebar, [location.pathname]);

  const renderNavigation = () => (
    <>
      <div className="px-5 pt-[14px] pb-[6px]">
        <div className="text-[10px] uppercase tracking-[1.2px] text-white/35 font-semibold">
          {intl.formatMessage({ id: 'sidebar.orgProfile' })}
        </div>
      </div>
      <div className="mx-4 mb-4">
        <button
          onClick={onProfileClick}
          className={`w-full px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-all hover:opacity-80 ${profileConfig[profile].color}`}
        >
          <span className={`w-[7px] h-[7px] rounded-full ${profileConfig[profile].dot}`} />
          <span>{profileConfig[profile].label}</span>
          <span className="ml-auto text-[11px] opacity-60">
            {intl.formatMessage({ id: 'sidebar.change' })} ›
          </span>
        </button>
      </div>

      <div className="mx-4 mb-1">
        <div className="flex bg-white/5 rounded-md p-[3px]">
          <button
            onClick={() => setNavView('process')}
            className={`flex-1 text-center py-1.5 text-[11px] font-medium rounded transition-all ${
              navView === 'process' ? 'bg-white/10 text-white' : 'text-white/45'
            }`}
          >
            {intl.formatMessage({ id: 'sidebar.byProcess' })}
          </button>
          <button
            onClick={() => setNavView('module')}
            className={`flex-1 text-center py-1.5 text-[11px] font-medium rounded transition-all ${
              navView === 'module' ? 'bg-white/10 text-white' : 'text-white/45'
            }`}
          >
            {intl.formatMessage({ id: 'sidebar.byModule' })}
          </button>
        </div>
      </div>

      <nav className="flex-1 py-2">
        {navView === 'process' ? (
          <>
            <NavSection label={intl.formatMessage({ id: 'sidebar.complianceJourney' })} />
            {processMenuItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={isPathActive(item.path)}
                onClick={() => handleNavigation(item)}
                userPlan={userPlan}
                intl={intl}
              />
            ))}
            <NavSection label={intl.formatMessage({ id: 'sidebar.intelligence' })} />
            {intelligenceMenuItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={isPathActive(item.path)}
                onClick={() => handleNavigation(item)}
                userPlan={userPlan}
                intl={intl}
              />
            ))}
          </>
        ) : (
          <>
            <NavSection label={intl.formatMessage({ id: 'sidebar.coreModules' })} />
            {coreModulesItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={isPathActive(item.path)}
                onClick={() => handleNavigation(item)}
                userPlan={userPlan}
                intl={intl}
              />
            ))}
            <NavSection label={intl.formatMessage({ id: 'sidebar.intelligence' })} />
            {intelligenceMenuItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={isPathActive(item.path)}
                onClick={() => handleNavigation(item)}
                userPlan={userPlan}
                intl={intl}
              />
            ))}
            <NavSection label={intl.formatMessage({ id: 'sidebar.regulatoryModules' })} />
            {regulatoryModulesItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={isPathActive(item.path)}
                onClick={() => handleNavigation(item)}
                userPlan={userPlan}
                intl={intl}
              />
            ))}
          </>
        )}
      </nav>

      <div className="mt-auto border-t border-white/10">
        <NavSection label={intl.formatMessage({ id: 'sidebar.settings' })} />
        {settingsItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={isPathActive(item.path)}
            onClick={() => handleNavigation(item)}
            userPlan={userPlan}
            intl={intl}
          />
        ))}

        <div className="px-6 py-4 flex items-center gap-2.5 cursor-pointer hover:bg-white/5 transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center text-[13px] font-semibold text-white">
            MK
          </div>
          <div className="text-[12.5px]">
            <div>Max Kellner</div>
            <div className="text-[11px] text-white/40">CISO · WellQ</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <MobileOptimizedDrawer
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        title={drawerTitle}
        closeLabel={intl.formatMessage({ id: 'sidebar.closeMenu', defaultMessage: 'Cerrar menú' })}
      >
        {renderNavigation()}
      </MobileOptimizedDrawer>

      <aside
        className={`
          ${darkMode ? 'bg-[#0A0D16]' : 'bg-[#0F1729]'}
          text-white hidden lg:flex flex-col h-screen overflow-y-auto transition-all duration-300 z-50 w-[260px] sticky top-0
        `}
      >
        <div className="px-5 py-[22px] border-b border-white/10 flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-lg bg-[#4F6EF7] flex items-center justify-center font-bold text-[15px]">
            D
          </div>
          <div>
            <div className="text-[15px] font-semibold -tracking-[0.2px]">Dani Platform</div>
            <div className="text-[11px] text-white/45 mt-0.5">v4 — Compliance Intelligence</div>
          </div>
        </div>

        {renderNavigation()}
      </aside>
    </>
  );
}

function NavSection({ label }: { label: string }) {
  return (
    <div className="px-5 pt-[18px] pb-2 text-[10px] uppercase tracking-[1.2px] text-white/30 font-semibold">
      {label}
    </div>
  );
}

interface NavItemProps {
  item: MenuItem;
  isActive: boolean;
  onClick: () => void;
  userPlan: 'free' | 'starter' | 'pro' | 'enterprise';
  intl: any;
}

function NavItem({ item, isActive, onClick, userPlan, intl }: NavItemProps) {
  const hasAccessToItem = hasAccess(item.requiredPlan, userPlan);
  const isLocked = !hasAccessToItem;

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={isLocked}
        aria-current={isActive ? 'page' : undefined}
        className={`
          w-full flex items-center gap-[11px] px-5 py-2 mx-2 my-0.5 rounded-lg text-[13.5px] transition-all
          ${isActive ? 'bg-[#232E4A] text-white font-medium' : 'text-white/60 hover:bg-[#1A2340] hover:text-white/85'}
          ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Icon or Step Number */}
        {item.stepNum ? (
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
              item.isCompleted
                ? 'bg-[#1DB954]'
                : isActive
                ? 'bg-[#4F6EF7]'
                : 'bg-white/8'
            }`}
          >
            {item.stepNum}
          </span>
        ) : (
          <span className="w-[18px] text-center text-[15px] flex-shrink-0">{item.icon}</span>
        )}

        {/* Label */}
        <span className="flex-1 text-left">
          {intl.formatMessage({ id: item.labelKey })}
        </span>

        {/* Lock Icon */}
        {isLocked && (
          <Lock className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
        )}

        {/* Badge */}
        {!isLocked && item.badge && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              item.badgeType === 'warn'
                ? 'bg-[#F5A623] text-white'
                : 'bg-[#E5484D] text-white'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>

      {/* Tooltip for locked items */}
      {isLocked && item.requiredPlan && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1A1D26] text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          {intl.formatMessage(
            { id: 'sidebar.availableInPlan' },
            { plan: getRequiredPlanName(item.requiredPlan) }
          )}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1A1D26]" />
        </div>
      )}
    </div>
  );
}

// Skeleton Loader Component
export function SidebarSkeleton({ darkMode }: { darkMode: boolean }) {
  return (
    <aside
      className={`
        ${darkMode ? 'bg-[#0A0D16]' : 'bg-[#0F1729]'}
        w-[260px] h-screen flex flex-col fixed lg:sticky top-0 left-0 z-50
      `}
    >
      {/* Header Skeleton */}
      <div className="px-5 py-[22px] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-lg bg-white/10 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/10 rounded animate-pulse w-32" />
            <div className="h-2 bg-white/10 rounded animate-pulse w-40" />
          </div>
        </div>
      </div>

      {/* Profile Skeleton */}
      <div className="px-4 pt-4 pb-3">
        <div className="h-2 bg-white/10 rounded animate-pulse w-24 mb-2" />
        <div className="h-9 bg-white/10 rounded-md animate-pulse" />
      </div>

      {/* Nav Toggle Skeleton */}
      <div className="mx-4 mb-4">
        <div className="h-8 bg-white/5 rounded-md animate-pulse" />
      </div>

      {/* Menu Items Skeleton */}
      <div className="flex-1 space-y-1 px-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-9 bg-white/5 rounded-lg mx-2 animate-pulse" />
        ))}
      </div>

      {/* Footer Skeleton */}
      <div className="border-t border-white/10 p-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/10 rounded animate-pulse w-20" />
            <div className="h-2 bg-white/10 rounded animate-pulse w-24" />
          </div>
        </div>
      </div>
    </aside>
  );
}
