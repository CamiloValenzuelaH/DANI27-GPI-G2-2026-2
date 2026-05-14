import { useState } from 'react';

type Page = 'dashboard' | 'understand' | 'documents' | 'risks' | 'evidence' | 'findings' | 'audit' | 'integrity' | 'regfeed' | 'dora' | 'euai' | 'escalation' | 'integrations' | 'settings';
type NavView = 'process' | 'module';
type Profile = 'foundational' | 'established' | 'advanced' | 'mature';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  profile: Profile;
  setShowProfileOverlay: (show: boolean) => void;
  darkMode: boolean;
  t: any;
}

export default function Sidebar({ activePage, setActivePage, profile, setShowProfileOverlay, darkMode, t }: SidebarProps) {
  const [navView, setNavView] = useState<NavView>('process');

  const profileConfig = {
    foundational: { color: 'bg-[#F5A623]/15 text-[#F5A623]', dot: 'bg-[#F5A623]', label: 'Foundational' },
    established: { color: 'bg-[#4F6EF7]/15 text-[#8BA3F9]', dot: 'bg-[#8BA3F9]', label: 'Established' },
    advanced: { color: 'bg-[#8B5CF6]/15 text-[#B794F6]', dot: 'bg-[#B794F6]', label: 'Advanced' },
    mature: { color: 'bg-[#1DB954]/15 text-[#1DB954]', dot: 'bg-[#1DB954]', label: 'Mature' },
  };

  return (
    <aside className={`w-[260px] text-white flex flex-col fixed h-screen overflow-y-auto transition-colors duration-300 ${darkMode ? 'bg-[#0A0D16]' : 'bg-[#0F1729]'}`}>
      {/* Logo */}
      <div className="px-5 py-[22px] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-lg bg-[#4F6EF7] flex items-center justify-center font-bold text-[15px]">
            D
          </div>
          <div>
            <div className="text-[15px] font-semibold -tracking-[0.2px]">Dani Platform</div>
            <div className="text-[11px] text-white/45 mt-0.5">v4 — Compliance Intelligence</div>
          </div>
        </div>
      </div>

      {/* Profile Badge */}
      <div className="px-5 pt-[14px] pb-[6px]">
        <div className="text-[10px] uppercase tracking-[1.2px] text-white/35 font-semibold">
          Organization Profile
        </div>
      </div>
      <div className="mx-4 mb-4">
        <button
          onClick={() => setShowProfileOverlay(true)}
          className={`w-full px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-all hover:opacity-80 ${profileConfig[profile].color}`}
        >
          <span className={`w-[7px] h-[7px] rounded-full ${profileConfig[profile].dot}`} />
          <span>{profileConfig[profile].label}</span>
          <span className="ml-auto text-[11px] opacity-60">Change ›</span>
        </button>
      </div>

      {/* Nav Toggle */}
      <div className="mx-4 mb-1">
        <div className="flex bg-white/5 rounded-md p-[3px]">
          <button
            onClick={() => setNavView('process')}
            className={`flex-1 text-center py-1.5 text-[11px] font-medium rounded transition-all ${
              navView === 'process' ? 'bg-white/10 text-white' : 'text-white/45'
            }`}
          >
            By Process
          </button>
          <button
            onClick={() => setNavView('module')}
            className={`flex-1 text-center py-1.5 text-[11px] font-medium rounded transition-all ${
              navView === 'module' ? 'bg-white/10 text-white' : 'text-white/45'
            }`}
          >
            By Module
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        {navView === 'process' ? (
          <>
            <NavSection label="Compliance Journey" />
            <NavItem active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} icon="step" stepNum="1">
              {t.dashboard}
            </NavItem>
            <NavItem active={activePage === 'understand'} onClick={() => setActivePage('understand')} icon="step" stepNum="✓" completed>
              {t.understand}
            </NavItem>
            <NavItem active={activePage === 'documents'} onClick={() => setActivePage('documents')} icon="step" stepNum="3" badge="4" badgeType="warn">
              {t.documents}
            </NavItem>
            <NavItem active={activePage === 'risks'} onClick={() => setActivePage('risks')} icon="step" stepNum="4">
              {t.risks}
            </NavItem>
            <NavItem active={activePage === 'evidence'} onClick={() => setActivePage('evidence')} icon="step" stepNum="5" badge="7">
              {t.evidence}
            </NavItem>
            <NavItem active={activePage === 'findings'} onClick={() => setActivePage('findings')} icon="step" stepNum="6">
              {t.findings}
            </NavItem>
            <NavItem active={activePage === 'audit'} onClick={() => setActivePage('audit')} icon="step" stepNum="7">
              {t.audit}
            </NavItem>
            <NavSection label="Intelligence" />
            <NavItem active={activePage === 'integrity'} onClick={() => setActivePage('integrity')} icon="⚠" badge="3">
              {t.integrity}
            </NavItem>
            <NavItem active={activePage === 'regfeed'} onClick={() => setActivePage('regfeed')} icon="📢" badge="2" badgeType="warn">
              {t.regfeed}
            </NavItem>
          </>
        ) : (
          <>
            <NavSection label="Core Modules" />
            <NavItem active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} icon="📊">
              {t.dashboard}
            </NavItem>
            <NavItem active={activePage === 'understand'} onClick={() => setActivePage('understand')} icon="🔍">
              {t.gapAnalysis}
            </NavItem>
            <NavItem active={activePage === 'documents'} onClick={() => setActivePage('documents')} icon="📄">
              {t.documentGenerator}
            </NavItem>
            <NavItem active={activePage === 'risks'} onClick={() => setActivePage('risks')} icon="🛡️">
              {t.riskMap}
            </NavItem>
            <NavItem active={activePage === 'evidence'} onClick={() => setActivePage('evidence')} icon="📦">
              {t.evidenceCenter}
            </NavItem>
            <NavItem active={activePage === 'findings'} onClick={() => setActivePage('findings')} icon="🔧">
              {t.capaTracker}
            </NavItem>
            <NavItem active={activePage === 'audit'} onClick={() => setActivePage('audit')} icon="🏛️">
              {t.auditRoom}
            </NavItem>
            <NavSection label="Intelligence" />
            <NavItem active={activePage === 'integrity'} onClick={() => setActivePage('integrity')} icon="⚠">
              {t.integrity}
            </NavItem>
            <NavItem active={activePage === 'regfeed'} onClick={() => setActivePage('regfeed')} icon="📢">
              {t.regfeed}
            </NavItem>
            <NavSection label="Regulatory Modules" />
            <NavItem active={activePage === 'dora'} onClick={() => setActivePage('dora')} icon="🏦">
              DORA Module
            </NavItem>
            <NavItem active={activePage === 'euai'} onClick={() => setActivePage('euai')} icon="🤖">
              EU AI Act
            </NavItem>
          </>
        )}
      </nav>

      {/* Settings at bottom */}
      <div className="mt-auto border-t border-white/10">
        <NavSection label={t.settings} />
        <NavItem active={activePage === 'escalation'} onClick={() => setActivePage('escalation')} icon="⚙">
          {t.escalation}
        </NavItem>
        <NavItem active={activePage === 'integrations'} onClick={() => setActivePage('integrations')} icon="🔗">
          {t.integrations}
        </NavItem>
        <NavItem active={activePage === 'settings'} onClick={() => setActivePage('settings')} icon="⚙">
          {t.settings}
        </NavItem>

        <div className="px-6 py-4 flex items-center gap-2.5 cursor-pointer hover:bg-white/5 transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center text-[13px] font-semibold">
            MK
          </div>
          <div className="text-[12.5px]">
            <div>Max Kellner</div>
            <div className="text-[11px] text-white/40">CISO · WellQ</div>
          </div>
        </div>
      </div>
    </aside>
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
  active?: boolean;
  completed?: boolean;
  onClick: () => void;
  icon: string | 'step';
  stepNum?: string;
  badge?: string;
  badgeType?: 'count' | 'warn';
  children: React.ReactNode;
}

function NavItem({ active, completed, onClick, icon, stepNum, badge, badgeType = 'count', children }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-[11px] px-5 py-2 mx-2 my-0.5 rounded-lg text-[13.5px] transition-all ${
        active
          ? 'bg-[#232E4A] text-white font-medium'
          : 'text-white/60 hover:bg-[#1A2340] hover:text-white/85'
      }`}
    >
      {icon === 'step' ? (
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
            completed
              ? 'bg-[#1DB954]'
              : active
              ? 'bg-[#4F6EF7]'
              : 'bg-white/8'
          }`}
        >
          {stepNum}
        </span>
      ) : (
        <span className="w-[18px] text-center text-[15px] flex-shrink-0">{icon}</span>
      )}
      <span className="flex-1 text-left">{children}</span>
      {badge && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
            badgeType === 'warn'
              ? 'bg-[#F5A623] text-white'
              : 'bg-[#E5484D] text-white'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
