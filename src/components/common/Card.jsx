const Card = ({ children, className = '', padding = 'default' }) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;