interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export default function Toggle({ value, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full relative transition-colors flex items-center ${value ? 'bg-[#4F6EF7]' : 'bg-[#E2E5EB] dark:bg-[#2A2E3D]'}`}
    >
      <span
        className={`w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
