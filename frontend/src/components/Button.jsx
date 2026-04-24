import React from 'react';

const Button = ({ children, variant = 'primary', fullWidth = false, onClick, className = '', disabled = false }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 24px',
    borderRadius: 'var(--radius-md)',
    fontSize: '16px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-accent-gold)',
      color: 'var(--color-white)',
      boxShadow: '0 4px 14px rgba(200, 169, 81, 0.3)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)',
      border: '2px solid var(--color-secondary-bg)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    }
  };

  return (
    <button 
      style={{ ...baseStyle, ...variants[variant] }} 
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`btn ${className}`}
      onMouseOver={(e) => !disabled && (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseOut={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  );
};

export default Button;
