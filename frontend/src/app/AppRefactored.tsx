<<<<<<< HEAD
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatWidget from './components/ChatWidget';
import DashboardPage from './pages/DashboardPage';
import { translations, Language, Page, Profile } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [profile, setProfile] = useState<Profile>('established');
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('es');
  const [dateFormat, setDateFormat] = useState<'dmy' | 'mdy' | 'ymd'>('dmy');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const t = translations[language];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#111318]' : 'bg-[#F7F8FA]'}`}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        profile={profile}
        setShowProfileOverlay={setShowProfileOverlay}
        darkMode={darkMode}
        t={t}
      />

      <main className="ml-[260px] flex-1">
        <Header darkMode={darkMode} notifications={notifications} t={t} />

        <div className="p-8 max-w-[1200px]">
          {activePage === 'dashboard' && <DashboardPage t={t} />}
          {/* Otras páginas aquí */}
        </div>
      </main>

      <ChatWidget darkMode={darkMode} t={t} />

      {showProfileOverlay && (
        <ProfileOverlay
          profile={profile}
          setProfile={setProfile}
          setShowProfileOverlay={setShowProfileOverlay}
        />
      )}
    </div>
  );
}

function ProfileOverlay({ profile, setProfile, setShowProfileOverlay }: any) {
  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-[90%] shadow-2xl">
        <h2 className="text-lg font-bold mb-2">Select Organization Profile</h2>
        <p className="text-[13px] text-[#5F6B7A] mb-5">
          Choose your organization's compliance maturity level.
        </p>
        <div className="space-y-2.5">
          {(['foundational', 'established', 'advanced', 'mature'] as Profile[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setProfile(p);
                setShowProfileOverlay(false);
              }}
              className={`w-full p-4 border-2 rounded-xl flex items-center gap-3 transition-all hover:border-[#4F6EF7] hover:bg-[#EEF1FE] ${
                profile === p ? 'border-[#4F6EF7] bg-[#EEF1FE]' : 'border-[#E2E5EB]'
              }`}
            >
              <div className="text-2xl">
                {p === 'foundational' && '🌱'}
                {p === 'established' && '🏗️'}
                {p === 'advanced' && '🚀'}
                {p === 'mature' && '⭐'}
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-[13.5px] capitalize">{p}</div>
                <div className="text-xs text-[#5F6B7A]">
                  {p === 'foundational' && 'Starting compliance journey'}
                  {p === 'established' && 'Basic controls in place'}
                  {p === 'advanced' && 'Mature program with testing'}
                  {p === 'mature' && 'Continuous improvement culture'}
                </div>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowProfileOverlay(false)}
          className="mt-5 w-full py-2.5 border border-[#E2E5EB] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
=======
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatWidget from './components/ChatWidget';
import DashboardPage from './pages/DashboardPage';
import { translations, Language, Page, Profile } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [profile, setProfile] = useState<Profile>('established');
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('es');
  const [dateFormat, setDateFormat] = useState<'dmy' | 'mdy' | 'ymd'>('dmy');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const t = translations[language];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#111318]' : 'bg-[#F7F8FA]'}`}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        profile={profile}
        setShowProfileOverlay={setShowProfileOverlay}
        darkMode={darkMode}
        t={t}
      />

      <main className="ml-[260px] flex-1">
        <Header darkMode={darkMode} notifications={notifications} t={t} />

        <div className="p-8 max-w-[1200px]">
          {activePage === 'dashboard' && <DashboardPage t={t} />}
          {/* Otras páginas aquí */}
        </div>
      </main>

      <ChatWidget darkMode={darkMode} t={t} />

      {showProfileOverlay && (
        <ProfileOverlay
          profile={profile}
          setProfile={setProfile}
          setShowProfileOverlay={setShowProfileOverlay}
        />
      )}
    </div>
  );
}

function ProfileOverlay({ profile, setProfile, setShowProfileOverlay }: any) {
  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-[90%] shadow-2xl">
        <h2 className="text-lg font-bold mb-2">Select Organization Profile</h2>
        <p className="text-[13px] text-[#5F6B7A] mb-5">
          Choose your organization's compliance maturity level.
        </p>
        <div className="space-y-2.5">
          {(['foundational', 'established', 'advanced', 'mature'] as Profile[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setProfile(p);
                setShowProfileOverlay(false);
              }}
              className={`w-full p-4 border-2 rounded-xl flex items-center gap-3 transition-all hover:border-[#4F6EF7] hover:bg-[#EEF1FE] ${
                profile === p ? 'border-[#4F6EF7] bg-[#EEF1FE]' : 'border-[#E2E5EB]'
              }`}
            >
              <div className="text-2xl">
                {p === 'foundational' && '🌱'}
                {p === 'established' && '🏗️'}
                {p === 'advanced' && '🚀'}
                {p === 'mature' && '⭐'}
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-[13.5px] capitalize">{p}</div>
                <div className="text-xs text-[#5F6B7A]">
                  {p === 'foundational' && 'Starting compliance journey'}
                  {p === 'established' && 'Basic controls in place'}
                  {p === 'advanced' && 'Mature program with testing'}
                  {p === 'mature' && 'Continuous improvement culture'}
                </div>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowProfileOverlay(false)}
          className="mt-5 w-full py-2.5 border border-[#E2E5EB] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
>>>>>>> Chat-bot
