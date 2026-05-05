import { useState } from 'react';
import { LayoutProvider } from '../contexts/LayoutContext';
import { I18nProvider } from '../i18n';
import SidebarPro, { SidebarSkeleton } from './SidebarPro';
import NavbarPro, { NavbarSkeleton } from './NavbarPro';
import ChatWidget from './ChatWidget';
import { Language, Profile } from '../types';
import { translations } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { isLoading } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [profile, setProfile] = useState<Profile>('foundational');
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);

  const t = translations[language];

  if (isLoading) {
    return (
      <div className={`flex h-screen ${darkMode ? 'bg-[#0A0D16]' : 'bg-[#F8F9FC]'}`}>
        <SidebarSkeleton darkMode={darkMode} />
        <div className="flex-1 flex flex-col">
          <NavbarSkeleton darkMode={darkMode} />
          <div className="flex-1 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="h-8 bg-white/10 rounded animate-pulse w-64" />
              <div className="h-32 bg-white/10 rounded animate-pulse" />
              <div className="h-64 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <I18nProvider locale={language}>
      <LayoutProvider initialPlan="pro">
        <div className={`flex h-screen ${darkMode ? 'bg-[#0A0D16]' : 'bg-[#F8F9FC]'}`}>
          <SidebarPro
            profile={profile}
            onProfileClick={() => setShowProfileOverlay(true)}
            darkMode={darkMode}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <NavbarPro
              darkMode={darkMode}
              onProfileClick={() => setShowProfileOverlay(true)}
            />

            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>

          <ChatWidget darkMode={darkMode} t={t} />

          {showProfileOverlay && (
            <ProfileOverlay
              currentProfile={profile}
              onSelect={(newProfile) => {
                setProfile(newProfile);
                setShowProfileOverlay(false);
              }}
              onClose={() => setShowProfileOverlay(false)}
              darkMode={darkMode}
            />
          )}
        </div>
      </LayoutProvider>
    </I18nProvider>
  );
}

interface ProfileOverlayProps {
  currentProfile: Profile;
  onSelect: (profile: Profile) => void;
  onClose: () => void;
  darkMode: boolean;
}

function ProfileOverlay({ currentProfile, onSelect, onClose, darkMode }: ProfileOverlayProps) {
  const profiles: Array<{ id: Profile; label: string; color: string; description: string }> = [
    {
      id: 'foundational',
      label: 'Foundational',
      color: 'bg-[#F5A623]',
      description: 'Just getting started with compliance',
    },
    {
      id: 'established',
      label: 'Established',
      color: 'bg-[#8BA3F9]',
      description: 'Basic controls in place, working on maturity',
    },
    {
      id: 'advanced',
      label: 'Advanced',
      color: 'bg-[#B794F6]',
      description: 'Mature program, optimizing for efficiency',
    },
    {
      id: 'mature',
      label: 'Mature',
      color: 'bg-[#1DB954]',
      description: 'Industry-leading compliance program',
    },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] rounded-xl shadow-2xl z-50 ${
          darkMode ? 'bg-[#1A1D28]' : 'bg-white'
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Select Organization Profile
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-white/60' : 'text-gray-600'}`}>
            Choose the profile that best matches your compliance maturity
          </p>
        </div>
        <div className="p-6 space-y-3">
          {profiles.map((prof) => (
            <button
              key={prof.id}
              onClick={() => onSelect(prof.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                currentProfile === prof.id
                  ? 'border-[#4F6EF7] bg-[#4F6EF7]/10'
                  : darkMode
                  ? 'border-[#2A2E3D] hover:border-[#4F6EF7]/50'
                  : 'border-gray-200 hover:border-[#4F6EF7]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${prof.color}`} />
                <div className="flex-1">
                  <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {prof.label}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-white/60' : 'text-gray-600'}`}>
                    {prof.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}