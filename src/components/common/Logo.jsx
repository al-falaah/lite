import { BookOpen } from 'lucide-react';

const Logo = ({ variant = 'default', size = 'default', className = '' }) => {
  const sizes = {
    small: {
      text: 'text-lg',
      icon: 20,
      subtitle: 'text-xs',
    },
    default: {
      text: 'text-2xl',
      icon: 28,
      subtitle: 'text-sm',
    },
    large: {
      text: 'text-4xl',
      icon: 40,
      subtitle: 'text-base',
    },
  };

  const variants = {
    default: 'text-emerald-600',
    white: 'text-white',
    dark: 'text-gray-900',
  };

  const sizeConfig = sizes[size];
  const colorClass = variants[variant];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <BookOpen className={colorClass} size={sizeConfig.icon} strokeWidth={2.5} />
      <div className="flex flex-col">
        <span className={`font-brand font-bold ${sizeConfig.text} ${colorClass} leading-tight`}>
          The FastTrack Madrasah
        </span>
        <span className={`${sizeConfig.subtitle} ${colorClass} opacity-80 leading-tight`}>
          Essential Islamic Studies
        </span>
      </div>
    </div>
  );
};

export default Logo;
