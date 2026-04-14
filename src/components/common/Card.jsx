const Card = ({ children, className = '', padding = 'default' }) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;