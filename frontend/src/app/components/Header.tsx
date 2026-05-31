import { Search, Bell } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  notifications: boolean;
  t: any;
}

export default function Header({ darkMode, notifications, t }: HeaderProps) {
  return (
    <header className={`px-8 py-4 border-b transition-colors duration-300 ${darkMode ? 'bg-[#1A1D28] border-[#2A2E3D]' : 'bg-white border-[#E2E5EB]'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3B0]" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent transition-colors ${
                darkMode
                  ? 'bg-[#111318] border-[#2A2E3D] text-[#E4E7EE]'
                  : 'bg-[#F7F8FA] border-[#E2E5EB] text-[#1A1D26]'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className={`p-2 rounded-lg transition-colors relative ${darkMode ? 'hover:bg-[#2A2E3D]' : 'hover:bg-gray-100'}`}>
            <Bell className="w-5 h-5 text-[#5F6B7A]" />
            {notifications && <span className="absolute top-1 right-1 w-2 h-2 bg-[#E5484D] rounded-full" />}
          </button>

          <div className={`flex items-center gap-3 pl-4 border-l ${darkMode ? 'border-[#2A2E3D]' : 'border-[#E2E5EB]'}`}>
            <div className="text-right">
              <div className={`font-medium text-sm ${darkMode ? 'text-[#E4E7EE]' : 'text-[#1A1D26]'}`}>Diego Vera</div>
              <div className="text-xs text-[#9AA3B0]">{t.administrator}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-semibold">
              DV
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
