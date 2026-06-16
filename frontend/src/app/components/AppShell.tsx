import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LayoutProvider } from '../contexts/LayoutContext';
import { I18nProvider } from '../i18n';
import SidebarPro, { SidebarSkeleton } from './SidebarPro';
import NavbarPro, { NavbarSkeleton } from './NavbarPro';
import OnboardingTour from './OnboardingTour';
import ChatWidget from './ChatWidget';
import { DateFormat, Language, Profile } from '../types';
import { translations } from '../types';
import { useAuth } from '../contexts/AuthContext';

type PreferencesState = {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  language: Language;
  setLanguage: (value: Language) => void;
  profile: Profile;
  setProfile: (value: Profile) => void;
  dateFormat: DateFormat;
  setDateFormat: (value: DateFormat) => void;
  timezone: string;
  setTimezone: (value: string) => void;
  notifications: boolean;
  setNotifications: (value: boolean) => void;
  autoSave: boolean;
  setAutoSave: (value: boolean) => void;
  compactView: boolean;
  setCompactView: (value: boolean) => void;
  sidebarLabels: boolean;
  setSidebarLabels: (value: boolean) => void;
  capaReminders: boolean;
  setCapaReminders: (value: boolean) => void;
  regulatoryUpdates: boolean;
  setRegulatoryUpdates: (value: boolean) => void;
  auditDeadlines: boolean;
  setAuditDeadlines: (value: boolean) => void;
  autoRunAnalysis: boolean;
  setAutoRunAnalysis: (value: boolean) => void;
  scheduleFrequency: string;
  setScheduleFrequency: (value: string) => void;
};

const PREFERENCES_KEY = 'dani_preferences_v1';

const defaultPreferences = {
  darkMode: false,
  language: 'es' as Language,
  profile: 'established' as Profile,
  dateFormat: 'dmy' as DateFormat,
  timezone: 'UTC',
  notifications: true,
  autoSave: true,
  compactView: false,
  sidebarLabels: true,
  capaReminders: true,
  regulatoryUpdates: true,
  auditDeadlines: true,
  autoRunAnalysis: true,
  scheduleFrequency: 'monthly',
};

const PreferencesContext = createContext<PreferencesState | undefined>(undefined);

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within AppShell');
  }
  return context;
}

function loadPreferences() {
  if (typeof window === 'undefined') {
    return defaultPreferences;
  }

  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    if (!raw) {
      return defaultPreferences;
    }

    const saved = JSON.parse(raw);
    return {
      darkMode: typeof saved.darkMode === 'boolean' ? saved.darkMode : defaultPreferences.darkMode,
      language: ['en', 'es', 'pt', 'de', 'fr'].includes(saved.language) ? saved.language : defaultPreferences.language,
      profile: ['foundational', 'established', 'advanced', 'mature'].includes(saved.profile) ? saved.profile : defaultPreferences.profile,
      dateFormat: ['dmy', 'mdy', 'ymd'].includes(saved.dateFormat) ? saved.dateFormat : defaultPreferences.dateFormat,
      timezone: typeof saved.timezone === 'string' && saved.timezone ? saved.timezone : defaultPreferences.timezone,
      notifications: typeof saved.notifications === 'boolean' ? saved.notifications : defaultPreferences.notifications,
      autoSave: typeof saved.autoSave === 'boolean' ? saved.autoSave : defaultPreferences.autoSave,
      compactView: typeof saved.compactView === 'boolean' ? saved.compactView : defaultPreferences.compactView,
      sidebarLabels: typeof saved.sidebarLabels === 'boolean' ? saved.sidebarLabels : defaultPreferences.sidebarLabels,
      capaReminders: typeof saved.capaReminders === 'boolean' ? saved.capaReminders : defaultPreferences.capaReminders,
      regulatoryUpdates: typeof saved.regulatoryUpdates === 'boolean' ? saved.regulatoryUpdates : defaultPreferences.regulatoryUpdates,
      auditDeadlines: typeof saved.auditDeadlines === 'boolean' ? saved.auditDeadlines : defaultPreferences.auditDeadlines,
      autoRunAnalysis: typeof saved.autoRunAnalysis === 'boolean' ? saved.autoRunAnalysis : defaultPreferences.autoRunAnalysis,
      scheduleFrequency: typeof saved.scheduleFrequency === 'string' && saved.scheduleFrequency ? saved.scheduleFrequency : defaultPreferences.scheduleFrequency,
    };
  } catch {
    return defaultPreferences;
  }
}

interface AppShellProps {
  children?: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { isLoading } = useAuth();
  const initialPreferences = loadPreferences();
  const [darkMode, setDarkMode] = useState(initialPreferences.darkMode);
  const [language, setLanguage] = useState<Language>(initialPreferences.language);
  const [profile, setProfile] = useState<Profile>(initialPreferences.profile);
  const [dateFormat, setDateFormat] = useState<DateFormat>(initialPreferences.dateFormat);
  const [timezone, setTimezone] = useState(initialPreferences.timezone);
  const [notifications, setNotifications] = useState(initialPreferences.notifications);
  const [autoSave, setAutoSave] = useState(initialPreferences.autoSave);
  const [compactView, setCompactView] = useState(initialPreferences.compactView);
  const [sidebarLabels, setSidebarLabels] = useState(initialPreferences.sidebarLabels);
  const [capaReminders, setCapaReminders] = useState(initialPreferences.capaReminders);
  const [regulatoryUpdates, setRegulatoryUpdates] = useState(initialPreferences.regulatoryUpdates);
  const [auditDeadlines, setAuditDeadlines] = useState(initialPreferences.auditDeadlines);
  const [autoRunAnalysis, setAutoRunAnalysis] = useState(initialPreferences.autoRunAnalysis);
  const [scheduleFrequency, setScheduleFrequency] = useState(initialPreferences.scheduleFrequency);
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);

  const t = translations[language];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.localStorage.getItem('dani_show_onboarding') === '1') {
      setShowOnboardingTour(true);
      window.localStorage.removeItem('dani_show_onboarding');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({
        darkMode,
        language,
        profile,
        dateFormat,
        timezone,
        notifications,
        autoSave,
        compactView,
        sidebarLabels,
        capaReminders,
        regulatoryUpdates,
        auditDeadlines,
        autoRunAnalysis,
        scheduleFrequency,
      })
    );
  }, [darkMode, language, profile, dateFormat, timezone, notifications, autoSave, compactView, sidebarLabels, capaReminders, regulatoryUpdates, auditDeadlines, autoRunAnalysis, scheduleFrequency]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    }
  }, [darkMode, language]);

  const navigate = useNavigate()

  const preferencesValue = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      language,
      setLanguage,
      profile,
      setProfile,
      dateFormat,
      setDateFormat,
      timezone,
      setTimezone,
      notifications,
      setNotifications,
      autoSave,
      setAutoSave,
      compactView,
      setCompactView,
      sidebarLabels,
      setSidebarLabels,
      capaReminders,
      setCapaReminders,
      regulatoryUpdates,
      setRegulatoryUpdates,
      auditDeadlines,
      setAuditDeadlines,
      autoRunAnalysis,
      setAutoRunAnalysis,
      scheduleFrequency,
      setScheduleFrequency,
    }),
    [darkMode, language, profile, dateFormat, timezone, notifications, autoSave, compactView, sidebarLabels, capaReminders, regulatoryUpdates, auditDeadlines, autoRunAnalysis, scheduleFrequency]
  );

  const handleNavbarSearch = (query: string) => {
    if (!query.trim()) {
      return
    }
    navigate(`/dashboard?q=${encodeURIComponent(query.trim())}`)
  }

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
    <PreferencesContext.Provider value={preferencesValue}>
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
                onTutorialClick={() => setShowOnboardingTour(true)}
                onSearch={handleNavbarSearch}
              />

              <main className={`flex-1 overflow-auto ${compactView ? 'p-4' : ''}`}>
                {children ?? <Outlet />}
              </main>
            </div>

            <ChatWidget darkMode={darkMode} t={t} />
            <OnboardingTour open={showOnboardingTour} setOpen={setShowOnboardingTour} />

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
    </PreferencesContext.Provider>
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
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <div
          className={`w-full max-w-[480px] max-h-[calc(100vh-3.5rem)] overflow-y-auto rounded-t-3xl shadow-2xl sm:rounded-xl ${
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
      </div>
    </>
  )
}
