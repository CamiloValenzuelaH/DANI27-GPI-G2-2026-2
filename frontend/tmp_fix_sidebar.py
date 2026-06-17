from pathlib import Path

path = Path('src/app/components/SidebarPro.tsx')
text = path.read_text(encoding='utf-8')
old = '''  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${darkMode ? 'bg-[#0A0D16]' : 'bg-[#0F1729]'}
          text-white flex flex-col h-screen overflow-y-auto transition-all duration-300 z-50
          fixed top-0 left-0 w-[260px]
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky
        `}
      >
        {/* Header */}
        <div className="px-5 py-[22px] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[34px] h-[34px] rounded-lg bg-[#4F6EF7] flex items-center justify-center font-bold text-[15px]">
              D
            </div>
            <div>
              <div className="text-[15px] font-semibold -tracking-[0.2px]">Dani Platform</div>
              <div className="text-[11px] text-white/45 mt-0.5">v4 — Compliance Intelligence</div>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Badge */}
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

        {/* Nav Toggle */}
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

        {/* Navigation */}
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

        {/* Settings at bottom */}
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
      </aside>
    </>
  );
}'''
if old not in text:
    raise ValueError('Old string not found')
new = text.replace(old, '''  return (
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
  );''')
path.write_text(new, encoding='utf-8')
print('done')
