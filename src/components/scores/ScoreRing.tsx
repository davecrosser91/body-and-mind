'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useMemo } from 'react';

type Pillar = 'body' | 'mind' | 'balance';

interface ScoreRingProps {
  score: number;
  pillar: Pillar;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

const pillarColors: Record<Pillar, { primary: string; glow: string; label: string }> = {
  body: {
    primary: '#E8A854',
    glow: 'rgba(232, 168, 84, 0.4)',
    label: 'Body',
  },
  mind: {
    primary: '#5BCCB3',
    glow: 'rgba(91, 204, 179, 0.4)',
    label: 'Mind',
  },
  balance: {
    primary: '#FFFFFF',
    glow: 'rgba(255, 255, 255, 0.3)',
    label: 'Balance',
  },
};

export function ScoreRing({
  score,
  pillar,
  size = 160,
  strokeWidth = 8,
  showLabel = true,
  animate = true,
  className = '',
}: ScoreRingProps) {
  const colors = pillarColors[pillar];

  // Calculate dimensions
  const center = size / 2;
  const radius = center - strokeWidth - 4;
  const circumference = 2 * Math.PI * radius;

  // Animation spring
  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 20,
  });

  const strokeDashoffset = useTransform(
    springValue,
    (value) => circumference - (value / 100) * circumference
  );

  const displayScore = useTransform(springValue, (value) => Math.round(value));

  useEffect(() => {
    if (animate) {
      springValue.set(score);
    } else {
      springValue.jump(score);
    }
  }, [score, animate, springValue]);

  // Gradient ID unique to this instance
  const gradientId = useMemo(
    () => `score-gradient-${pillar}-${Math.random().toString(36).slice(2, 9)}`,
    [pillar]
  );

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Gradient definition */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.6" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Score arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          filter={`url(#glow-${gradientId})`}
        />

        {/* Animated end cap glow */}
        {score > 0 && (
          <motion.circle
            cx={center}
            cy={center - radius}
            r={strokeWidth / 2 + 2}
            fill={colors.primary}
            filter={`url(#glow-${gradientId})`}
            style={{
              opacity: useTransform(springValue, (v) => (v > 5 ? 0.6 : 0)),
            }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Score number */}
        <motion.span
          className="text-4xl font-bold tabular-nums"
          style={{ color: colors.primary }}
        >
          {displayScore}
        </motion.span>

        {/* Label */}
        {showLabel && (
          <span className="text-xs text-text-muted uppercase tracking-wider mt-1">
            {colors.label}
          </span>
        )}
      </div>

      {/* Breathing glow animation */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// Mini score ring for compact displays
export function MiniScoreRing({
  score,
  pillar,
  size = 48,
  className = '',
}: {
  score: number;
  pillar: Pillar;
  size?: number;
  className?: string;
}) {
  return (
    <ScoreRing
      score={score}
      pillar={pillar}
      size={size}
      strokeWidth={4}
      showLabel={false}
      className={className}
    />
  );
}
