import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import { useAuth } from '../contexts/AuthContext';
import { Search, Bell, Menu, ChevronDown } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  onProfileClick: () => void;
}

export default function NavbarPro({ darkMode, onProfileClick }: NavbarProps) {
  const { toggleSidebar, userPlan } = useLayout();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const intl = useIntl();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const planConfig = {
    free: { label: 'Free', color: 'text-gray-400' },
    starter: { label: 'Starter', color: 'text-blue-400' },
    pro: { label: 'Pro', color: 'text-purple-400' },
    enterprise: { label: 'Enterprise', color: 'text-green-400' },
  };

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/login');
  };

  // Genera las iniciales desde el nombre real del usuario
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  return (
    <header
      className={`
        ${darkMode ? 'bg-[#0A0D16] border-[#1E2330]' : 'bg-white border-[#E2E5EB]'}
        border-b px-5 py-3 flex items-center gap-4 sticky top-0 z-40 transition-colors
      `}
    >
      {/* Hamburger Menu - Mobile Only */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 hover:bg-white/10 rounded transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
      </button>

      {/* Search Bar */}
      <div className="flex-1 max-w-[480px]">
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              darkMode ? 'text-white/40' : 'text-gray-400'
            }`}
          />
          <input
            type="text"
            placeholder={intl.formatMessage({ id: 'header.searchPlaceholder' })}
            className={`
              w-full pl-10 pr-4 py-2 rounded-lg text-[13px] transition-all
              ${
                darkMode
                  ? 'bg-[#111318] border border-[#2A2E3D] text-[#E4E7EE] placeholder:text-white/40 focus:border-[#4F6EF7]'
                  : 'bg-[#F8F9FC] border border-transparent text-[#1A1D26] placeholder:text-gray-400 focus:bg-white focus:border-[#4F6EF7]'
              }
              focus:outline-none focus:ring-1 focus:ring-[#4F6EF7]/30
            `}
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className={`
            relative p-2 rounded-lg transition-colors
            ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}
          `}
        >
          <Bell className={`w-5 h-5 ${darkMode ? 'text-white/70' : 'text-gray-600'}`} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E5484D] rounded-full border-2 border-[#0A0D16]" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`
              flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors
              ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}
            `}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center text-[13px] font-semibold text-white">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <div className={`text-[13px] font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {user?.full_name ?? '—'}
              </div>
              <div className={`text-[11px] ${darkMode ? 'text-white/40' : 'text-gray-500'}`}>
                {user?.email ?? '—'}
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''} ${
                darkMode ? 'text-white/40' : 'text-gray-400'
              }`}
            />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowProfileMenu(false)}
              />
              <div
                className={`
                  absolute right-0 top-full mt-2 w-[240px] rounded-lg shadow-lg z-20
                  ${darkMode ? 'bg-[#1A1D28] border border-[#2A2E3D]' : 'bg-white border border-gray-200'}
                `}
              >
                <div className="p-3 border-b border-white/10">
                  <div className={`text-[13px] font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.full_name ?? '—'}
                  </div>
                  <div className={`text-[11px] ${darkMode ? 'text-white/40' : 'text-gray-500'}`}>
                    {user?.email ?? '—'}
                  </div>
                  <div className={`mt-2 text-[11px] font-semibold ${planConfig[userPlan].color}`}>
                    {planConfig[userPlan].label} {intl.formatMessage({ id: 'header.plan' })}
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      onProfileClick();
                      setShowProfileMenu(false);
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded text-[13px] transition-colors
                      ${darkMode ? 'hover:bg-white/10 text-white/90' : 'hover:bg-gray-100 text-gray-700'}
                    `}
                  >
                    {intl.formatMessage({ id: 'header.viewProfile' })}
                  </button>
                  <button
                    className={`
                      w-full text-left px-3 py-2 rounded text-[13px] transition-colors
                      ${darkMode ? 'hover:bg-white/10 text-white/90' : 'hover:bg-gray-100 text-gray-700'}
                    `}
                  >
                    {intl.formatMessage({ id: 'header.settings' })}
                  </button>
                  <div className={`my-1.5 h-px ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                  <button
                    onClick={handleSignOut}
                    className={`
                      w-full text-left px-3 py-2 rounded text-[13px] transition-colors text-[#E5484D]
                      ${darkMode ? 'hover:bg-white/10' : 'hover:bg-red-50'}
                    `}
                  >
                    {intl.formatMessage({ id: 'header.signOut' })}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function NavbarSkeleton({ darkMode }: { darkMode: boolean }) {
  return (
    <header
      className={`
        ${darkMode ? 'bg-[#0A0D16] border-[#1E2330]' : 'bg-white border-[#E2E5EB]'}
        border-b px-5 py-3 flex items-center gap-4 sticky top-0 z-40
      `}
    >
      <div className="lg:hidden w-9 h-9 bg-white/10 rounded animate-pulse" />
      <div className="flex-1 max-w-[480px]">
        <div className="h-9 bg-white/10 rounded-lg animate-pulse" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-white/10 rounded-lg animate-pulse" />
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
          <div className="hidden md:block space-y-1.5">
            <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-2.5 w-20 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </header>
  );
}