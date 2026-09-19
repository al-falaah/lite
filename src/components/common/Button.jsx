const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  className = ''
}) => {
  const baseStyles = 'font-medium rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    // The whole app is the maroon (wine) brand now, so the default primary,
    // the legacy `emerald` alias, and `outline` all resolve to wine.
    primary: 'bg-wine-600 hover:bg-wine-700 text-white shadow-sm',
    emerald: 'bg-wine-600 hover:bg-wine-700 text-white shadow-sm',
    wine: 'bg-wine-600 hover:bg-wine-700 text-white shadow-sm',
    wineOutline: 'border border-[#d8ccbe] text-[#2a1e1a] hover:bg-[#efe9dd]',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    outline: 'border border-wine-600 text-wine-600 hover:bg-wine-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
