'use client';

import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 0.8,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const displayValue = useTransform(springValue, (latest) => {
    if (decimals > 0) {
      return `${prefix}${latest.toFixed(decimals)}${suffix}`;
    }
    return `${prefix}${Math.round(latest)}${suffix}`;
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}

// Score variant with larger display
export function AnimatedScore({
  value,
  pillar,
  className = '',
}: {
  value: number;
  pillar: 'body' | 'mind' | 'balance';
  className?: string;
}) {
  const colorClasses = {
    body: 'text-body',
    mind: 'text-mind',
    balance: 'text-white',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <AnimatedCounter
        value={value}
        className={`text-4xl font-bold tabular-nums ${colorClasses[pillar]}`}
        duration={0.8}
      />
      <span className="text-xs text-text-muted uppercase tracking-wider mt-1">
        {pillar === 'balance' ? 'Balance' : pillar}
      </span>
    </div>
  );
}

// Percentage variant
export function AnimatedPercentage({
  value,
  className = '',
  showSymbol = true,
}: {
  value: number;
  className?: string;
  showSymbol?: boolean;
}) {
  return (
    <AnimatedCounter
      value={value}
      suffix={showSymbol ? '%' : ''}
      className={className}
      duration={0.6}
    />
  );
}

// Streak counter with ember styling
export function AnimatedStreak({
  days,
  intensity,
  className = '',
}: {
  days: number;
  intensity: 'dim' | 'steady' | 'bright' | 'golden';
  className?: string;
}) {
  const intensityStyles = {
    dim: 'text-text-muted',
    steady: 'text-ember-steady',
    bright: 'text-body',
    golden: 'text-ember-golden',
  };

  const glowStyles = {
    dim: '',
    steady: '',
    bright: 'drop-shadow-[0_0_8px_rgba(232,168,84,0.5)]',
    golden: 'drop-shadow-[0_0_12px_rgba(255,215,0,0.6)]',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Flame icon */}
      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${intensityStyles[intensity]} ${glowStyles[intensity]}`}
        animate={intensity === 'golden' ? { scale: [1, 1.1, 1] } : undefined}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.93 2.5-6.63 5-9.5.87-1 1.5-2.5 1.5-4 0 0 1.31 1.88 1.72 3.5C11.5 6.5 12 7.5 13 8c1.5-2 2.5-4 2.5-6 0 0 2.53 2.95 4 7 .73 2.02 1 3.5 1 5 0 4.42-4.03 8-8.5 9zm0-2c3.31 0 6-2.24 6-5 0-1.08-.27-2.19-.84-3.5-.57-1.31-1.4-2.74-2.16-4-.76 1.42-2 3.5-4 4-1 .25-2-.5-2.3-1.5-.1-.36-.1-.75-.1-1.1-.83 1.42-1.6 2.78-1.6 4.6 0 2.76 2.24 5 5 5z" />
      </motion.svg>

      {/* Day count */}
      <AnimatedCounter
        value={days}
        className={`text-lg font-semibold tabular-nums ${intensityStyles[intensity]}`}
        duration={0.5}
      />

      <span className="text-text-muted text-sm">
        {days === 1 ? 'day' : 'days'}
      </span>
    </div>
  );
}

// Mini counter for compact displays
export function MiniCounter({
  value,
  label,
  className = '',
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <AnimatedCounter
        value={value}
        className="text-xl font-semibold text-text-primary tabular-nums"
        duration={0.5}
      />
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}
