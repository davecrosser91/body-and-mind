'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'body' | 'mind';
  hover?: boolean;
  glow?: boolean;
  className?: string;
}

export function GlassCard({
  children,
  variant = 'default',
  hover = true,
  glow = false,
  className = '',
  ...motionProps
}: GlassCardProps) {
  const glowStyles = {
    default: '',
    body: 'shadow-body-glow',
    mind: 'shadow-mind-glow',
  };

  const borderStyles = {
    default: 'border-white/5',
    body: 'border-body/20',
    mind: 'border-mind/20',
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-2xl
        bg-surface/70 backdrop-blur-xl
        border ${borderStyles[variant]}
        ${glow ? glowStyles[variant] : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      {...motionProps}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// Variant without animation for static cards
export function GlassCardStatic({
  children,
  variant = 'default',
  glow = false,
  className = '',
}: {
  children: ReactNode;
  variant?: 'default' | 'body' | 'mind';
  glow?: boolean;
  className?: string;
}) {
  const glowStyles = {
    default: '',
    body: 'shadow-body-glow',
    mind: 'shadow-mind-glow',
  };

  const borderStyles = {
    default: 'border-white/5',
    body: 'border-body/20',
    mind: 'border-mind/20',
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-surface/70 backdrop-blur-xl
        border ${borderStyles[variant]}
        ${glow ? glowStyles[variant] : ''}
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
