<<<<<<< HEAD
interface HealthCardProps {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
  progress: number;
  badge?: string;
  badgeType?: 'auto' | 'review' | 'human';
  delta: string;
  deltaUp: boolean;
}

export default function HealthCard({ label, value, color, progress, badge, badgeType, delta, deltaUp }: HealthCardProps) {
  const colors = {
    blue: { text: 'text-[#4F6EF7] dark:text-[#6B8AFF]', bg: 'bg-gradient-to-r from-[#4F6EF7] to-[#818CF8]' },
    green: { text: 'text-[#1DB954] dark:text-[#34D969]', bg: 'bg-gradient-to-r from-[#1DB954] to-[#4ADE80]' },
    yellow: { text: 'text-[#F5A623] dark:text-[#F5B740]', bg: 'bg-gradient-to-r from-[#F5A623] to-[#FBBF24]' },
    red: { text: 'text-[#E5484D] dark:text-[#F06669]', bg: 'bg-gradient-to-r from-[#E5484D] to-[#F87171]' },
  };

  const badgeColors = {
    auto: 'bg-[#E8F4FD] dark:bg-[#132838] text-[#1B8BD1] dark:text-[#5CB8F0]',
    review: 'bg-[#FFF7E6] dark:bg-[#2A2210] text-[#B47A14] dark:text-[#F5B740]',
    human: 'bg-[#FEECEE] dark:bg-[#2A1214] text-[#E5484D] dark:text-[#F06669]',
  };

  return (
    <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] p-5 shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] relative transition-colors">
      {badge && badgeType && (
        <div className={`absolute top-3 right-3 text-[10px] px-2 py-1 rounded font-semibold ${badgeColors[badgeType]}`}>
          {badge}
        </div>
      )}
      <div className="text-xs text-[#5F6B7A] dark:text-[#9AA3B4] font-medium mb-2">{label}</div>
      <div className={`text-[32px] font-bold -tracking-[1px] ${colors[color].text}`}>
        {value}<span className="text-lg font-normal">%</span>
      </div>
      <div className="h-1.5 bg-[#E2E5EB] dark:bg-[#2A2E3D] rounded-full overflow-hidden mt-3 mb-1.5">
        <div className={`h-full ${colors[color].bg} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
      </div>
      <div className={`text-[11px] font-medium ${deltaUp ? 'text-[#1DB954] dark:text-[#34D969]' : 'text-[#E5484D] dark:text-[#F06669]'}`}>
        {delta}
      </div>
    </div>
  );
}
=======
interface HealthCardProps {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
  progress: number;
  badge?: string;
  badgeType?: 'auto' | 'review' | 'human';
  delta: string;
  deltaUp: boolean;
}

export default function HealthCard({ label, value, color, progress, badge, badgeType, delta, deltaUp }: HealthCardProps) {
  const colors = {
    blue: { text: 'text-[#4F6EF7] dark:text-[#6B8AFF]', bg: 'bg-gradient-to-r from-[#4F6EF7] to-[#818CF8]' },
    green: { text: 'text-[#1DB954] dark:text-[#34D969]', bg: 'bg-gradient-to-r from-[#1DB954] to-[#4ADE80]' },
    yellow: { text: 'text-[#F5A623] dark:text-[#F5B740]', bg: 'bg-gradient-to-r from-[#F5A623] to-[#FBBF24]' },
    red: { text: 'text-[#E5484D] dark:text-[#F06669]', bg: 'bg-gradient-to-r from-[#E5484D] to-[#F87171]' },
  };

  const badgeColors = {
    auto: 'bg-[#E8F4FD] dark:bg-[#132838] text-[#1B8BD1] dark:text-[#5CB8F0]',
    review: 'bg-[#FFF7E6] dark:bg-[#2A2210] text-[#B47A14] dark:text-[#F5B740]',
    human: 'bg-[#FEECEE] dark:bg-[#2A1214] text-[#E5484D] dark:text-[#F06669]',
  };

  return (
    <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] p-5 shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] relative transition-colors">
      {badge && badgeType && (
        <div className={`absolute top-3 right-3 text-[10px] px-2 py-1 rounded font-semibold ${badgeColors[badgeType]}`}>
          {badge}
        </div>
      )}
      <div className="text-xs text-[#5F6B7A] dark:text-[#9AA3B4] font-medium mb-2">{label}</div>
      <div className={`text-[32px] font-bold -tracking-[1px] ${colors[color].text}`}>
        {value}<span className="text-lg font-normal">%</span>
      </div>
      <div className="h-1.5 bg-[#E2E5EB] dark:bg-[#2A2E3D] rounded-full overflow-hidden mt-3 mb-1.5">
        <div className={`h-full ${colors[color].bg} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
      </div>
      <div className={`text-[11px] font-medium ${deltaUp ? 'text-[#1DB954] dark:text-[#34D969]' : 'text-[#E5484D] dark:text-[#F06669]'}`}>
        {delta}
      </div>
    </div>
  );
}
>>>>>>> Chat-bot
