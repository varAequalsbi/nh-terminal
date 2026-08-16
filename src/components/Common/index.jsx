// Button Component
export function Button({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  children, 
  className = '',
  ...props 
}) {
  const variants = {
    primary: 'bg-color-gold text-bg-primary hover:bg-opacity-90',
    secondary: 'bg-bg-secondary text-text-primary hover:bg-bg-tertiary',
    outline: 'border border-border-color text-text-primary hover:bg-bg-secondary',
    danger: 'bg-color-danger text-white hover:bg-opacity-90'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`
        ${variants[variant]} ${sizes[size]}
        rounded-radius-md font-semibold transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${loading ? 'opacity-75 cursor-wait' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? '⏳ Loading...' : children}
    </button>
  );
}

// Card Component
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-bg-secondary border border-border-color rounded-radius-lg p-6 ${className}`}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={`border-t border-border-color pt-4 mt-4 ${className}`}>
      {children}
    </div>
  );
};

// Badge Component
export function Badge({ 
  variant = 'default', 
  size = 'md', 
  children, 
  className = '' 
}) {
  const variants = {
    success: 'bg-color-success bg-opacity-20 text-color-success',
    danger: 'bg-color-danger bg-opacity-20 text-color-danger',
    warning: 'bg-color-warning bg-opacity-20 text-color-warning',
    info: 'bg-blue-500 bg-opacity-20 text-blue-300',
    default: 'bg-bg-tertiary text-text-secondary',
    gold: 'bg-color-gold bg-opacity-20 text-color-gold'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`
      ${variants[variant]} ${sizes[size]}
      rounded-full font-semibold inline-block
      ${className}
    `}>
      {children}
    </span>
  );
}

// Tab Component
export function Tabs({ activeTab, onChange, children, className = '' }) {
  return (
    <div className={className}>
      <div className="border-b border-border-color flex gap-4 mb-6">
        {React.Children.map(children, (child) =>
          child && (
            <button
              key={child.props.value}
              onClick={() => onChange(child.props.value)}
              className={`
                pb-3 px-2 font-semibold transition-colors whitespace-nowrap
                ${activeTab === child.props.value
                  ? 'text-color-gold border-b-2 border-color-gold'
                  : 'text-text-secondary hover:text-text-primary'
                }
              `}
            >
              {child.props.label}
            </button>
          )
        )}
      </div>
      <div className="tab-content">
        {React.Children.map(children, (child) =>
          child?.props.value === activeTab ? child : null
        )}
      </div>
    </div>
  );
}

export function Tab({ children, label, value }) {
  return <div>{children}</div>;
}

// Input Component
export function Input({ 
  type = 'text', 
  placeholder = '', 
  value, 
  onChange, 
  error = '',
  label = '',
  className = '',
  ...props 
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-text-primary mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          w-full px-4 py-2 bg-bg-tertiary border border-border-color
          rounded-radius-md text-text-primary placeholder-text-tertiary
          focus:outline-none focus:border-color-gold focus:ring-1 focus:ring-color-gold
          transition-colors
          ${error ? 'border-color-danger' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-color-danger text-xs mt-1">{error}</p>}
    </div>
  );
}

// Modal Component
export function Modal({ isOpen, title, children, onClose, footer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-bg-secondary border border-border-color rounded-radius-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button 
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6">{children}</div>
        
        {footer && (
          <div className="border-t border-border-color pt-4 flex gap-2 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Loader Component
export default function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-primary">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-color-gold animate-spin" />
        </div>
        <p className="text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}
