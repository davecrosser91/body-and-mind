'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useMemo } from 'react';

type EmberIntensity = 'dim' | 'steady' | 'bright' | 'golden';

interface EmberBarProps {
  days: number;
  maxDays?: number;
  showParticles?: boolean;
  className?: string;
}

function getEmberIntensity(days: number): EmberIntensity {
  if (days >= 14) return 'golden';
  if (days >= 7) return 'bright';
  if (days >= 4) return 'steady';
  return 'dim';
}

const intensityColors: Record<EmberIntensity, { bar: string; glow: string; text: string }> = {
  dim: {
    bar: 'rgba(232, 168, 84, 0.3)',
    glow: 'rgba(232, 168, 84, 0.1)',
    text: 'text-text-muted',
  },
  steady: {
    bar: 'rgba(232, 168, 84, 0.6)',
    glow: 'rgba(232, 168, 84, 0.2)',
    text: 'text-text-secondary',
  },
  bright: {
    bar: '#E8A854',
    glow: 'rgba(232, 168, 84, 0.4)',
    text: 'text-body',
  },
  golden: {
    bar: 'linear-gradient(90deg, #E8A854, #FFD700)',
    glow: 'rgba(255, 215, 0, 0.4)',
    text: 'text-amber-300',
  },
};

export function EmberBar({
  days,
  maxDays = 30,
  showParticles = true,
  className = '',
}: EmberBarProps) {
  const intensity = getEmberIntensity(days);
  const colors = intensityColors[intensity];
  const progress = Math.min((days / maxDays) * 100, 100);

  // Animated progress
  const springValue = useSpring(0, { stiffness: 50, damping: 20 });

  useEffect(() => {
    springValue.set(progress);
  }, [progress, springValue]);

  const width = useTransform(springValue, (v) => `${v}%`);

  // Generate particles for golden intensity
  const particles = useMemo(() => {
    if (intensity !== 'golden' || !showParticles) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: i * 0.3,
      x: 20 + Math.random() * 60, // % position along bar
    }));
  }, [intensity, showParticles]);

  return (
    <div className={`relative ${className}`}>
      {/* Label row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Flame icon */}
          <motion.svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={colors.text}
            animate={
              intensity === 'golden'
                ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }
                : intensity === 'bright'
                ? { scale: [1, 1.05, 1] }
                : undefined
            }
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.93 2.5-6.63 5-9.5.87-1 1.5-2.5 1.5-4 0 0 1.31 1.88 1.72 3.5C11.5 6.5 12 7.5 13 8c1.5-2 2.5-4 2.5-6 0 0 2.53 2.95 4 7 .73 2.02 1 3.5 1 5 0 4.42-4.03 8-8.5 9zm0-2c3.31 0 6-2.24 6-5 0-1.08-.27-2.19-.84-3.5-.57-1.31-1.4-2.74-2.16-4-.76 1.42-2 3.5-4 4-1 .25-2-.5-2.3-1.5-.1-.36-.1-.75-.1-1.1-.83 1.42-1.6 2.78-1.6 4.6 0 2.76 2.24 5 5 5z" />
          </motion.svg>

          <span className={`font-semibold ${colors.text}`}>
            {days} {days === 1 ? 'day' : 'days'}
          </span>
        </div>

        <span className="text-xs text-text-muted">streak</span>
      </div>

      {/* Progress bar container */}
      <div className="relative h-2 rounded-full bg-surface-light overflow-hidden">
        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width,
            background: colors.bar,
            boxShadow: `0 0 12px ${colors.glow}`,
          }}
        />

        {/* Shimmer effect for bright/golden */}
        {(intensity === 'bright' || intensity === 'golden') && (
          <motion.div
            className="absolute inset-y-0 w-20 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            }}
            animate={{ x: ['-80px', '400px'] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 1,
            }}
          />
        )}

        {/* Floating particles for golden */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full bg-amber-300"
            style={{ left: `${particle.x}%`, bottom: 0 }}
            animate={{
              y: [0, -20, -30],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Milestone markers */}
      <div className="relative h-1 mt-1">
        {[7, 14, 30].map((milestone) => {
          const position = (milestone / maxDays) * 100;
          const reached = days >= milestone;
          return (
            <div
              key={milestone}
              className="absolute top-0 transform -translate-x-1/2"
              style={{ left: `${Math.min(position, 100)}%` }}
            >
              <div
                className={`w-1 h-1 rounded-full ${
                  reached ? 'bg-body' : 'bg-surface-lighter'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact ember indicator (just icon + number)
export function EmberIndicator({
  days,
  className = '',
}: {
  days: number;
  className?: string;
}) {
  const intensity = getEmberIntensity(days);
  const colors = intensityColors[intensity];

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <motion.svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={colors.text}
        animate={intensity === 'golden' ? { scale: [1, 1.1, 1] } : undefined}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.93 2.5-6.63 5-9.5.87-1 1.5-2.5 1.5-4 0 0 1.31 1.88 1.72 3.5C11.5 6.5 12 7.5 13 8c1.5-2 2.5-4 2.5-6 0 0 2.53 2.95 4 7 .73 2.02 1 3.5 1 5 0 4.42-4.03 8-8.5 9zm0-2c3.31 0 6-2.24 6-5 0-1.08-.27-2.19-.84-3.5-.57-1.31-1.4-2.74-2.16-4-.76 1.42-2 3.5-4 4-1 .25-2-.5-2.3-1.5-.1-.36-.1-.75-.1-1.1-.83 1.42-1.6 2.78-1.6 4.6 0 2.76 2.24 5 5 5z" />
      </motion.svg>
      <span className={`text-sm font-medium ${colors.text}`}>{days}</span>
    </div>
  );
}
