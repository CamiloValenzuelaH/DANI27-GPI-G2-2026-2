from pathlib import Path

path = Path('src/app/components/SidebarPro.tsx')
text = path.read_text(encoding='utf-8')
start_marker = '  return (\n    <>\n      {/* Mobile Overlay */}\n'
end_marker = '      </aside>\n    </>\n  );\n}'
start = text.find(start_marker)
if start == -1:
    raise ValueError('start marker not found')
end = text.find(end_marker, start)
if end == -1:
    raise ValueError('end marker not found')
end += len(end_marker)
replacement = '''  return (
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
}'''
new_text = text[:start] + replacement + text[end:]
path.write_text(new_text, encoding='utf-8')
print('Replacement done')
