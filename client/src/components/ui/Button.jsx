import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  icon: Icon,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  style = {},
  ...props
}) {
  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  const variantClass = variant === 'icon' ? 'btn-icon' : `btn-${variant}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      style={style}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 12 : 14} />
      ) : null}
      {children}
    </button>
  );
}
