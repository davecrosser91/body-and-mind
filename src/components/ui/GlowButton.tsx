'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

type ButtonVariant = 'body' | 'mind' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GlowButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  glow?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles: Record<ButtonVariant, string> = {
  body: 'bg-body text-background hover:bg-body-light',
  mind: 'bg-mind text-background hover:bg-mind-light',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-light',
  outline: 'bg-transparent border border-surface-lighter text-text-secondary hover:border-body hover:text-body',
};

const glowStyles: Record<ButtonVariant, string> = {
  body: 'shadow-body-glow hover:shadow-body-glow-lg',
  mind: 'shadow-mind-glow hover:shadow-mind-glow-lg',
  ghost: '',
  outline: '',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-7 py-3.5 text-lg rounded-xl',
};

export function GlowButton({
  children,
  variant = 'body',
  size = 'md',
  glow = true,
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  className = '',
  ...motionProps
}: GlowButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      className={`
        relative inline-flex items-center justify-center gap-2
        font-medium transition-all duration-200
        ${variantStyles[variant]}
        ${glow ? glowStyles[variant] : ''}
        ${sizeStyles[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.15 }}
      {...motionProps}
    >
      {/* Loading spinner */}
      {loading && (
        <motion.span
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </motion.span>
      )}

      {/* Content */}
      <span className={`flex items-center gap-2 ${loading ? 'invisible' : ''}`}>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </span>
    </motion.button>
  );
}

// Icon-only variant
export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  glow = false,
  className = '',
  ...motionProps
}: Omit<GlowButtonProps, 'icon' | 'iconPosition'>) {
  const iconSizeStyles: Record<ButtonSize, string> = {
    sm: 'p-1.5 rounded-lg',
    md: 'p-2.5 rounded-xl',
    lg: 'p-3.5 rounded-xl',
  };

  return (
    <motion.button
      className={`
        inline-flex items-center justify-center
        transition-all duration-200
        ${variantStyles[variant]}
        ${glow ? glowStyles[variant] : ''}
        ${iconSizeStyles[size]}
        ${className}
      `}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
