'use client';

import { motion } from 'framer-motion';
import { ScoreRing } from './ScoreRing';
import { EmberBar } from './EmberBar';

interface ScoreDashboardProps {
  bodyScore: number;
  mindScore: number;
  balanceIndex: number;
  streakDays: number;
  className?: string;
}

export function ScoreDashboard({
  bodyScore,
  mindScore,
  balanceIndex,
  streakDays,
  className = '',
}: ScoreDashboardProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Score rings row */}
      <div className="flex items-center justify-center gap-4 md:gap-8">
        {/* Body Score */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ScoreRing score={bodyScore} pillar="body" size={140} />
        </motion.div>

        {/* Balance Index (smaller, in center) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative"
        >
          <ScoreRing score={balanceIndex} pillar="balance" size={80} strokeWidth={6} />

          {/* Connection lines (decorative) */}
          <svg
            className="absolute top-1/2 -left-6 w-6 h-px"
            style={{ transform: 'translateY(-50%)' }}
          >
            <line
              x1="0"
              y1="0"
              x2="24"
              y2="0"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          </svg>
          <svg
            className="absolute top-1/2 -right-6 w-6 h-px"
            style={{ transform: 'translateY(-50%)' }}
          >
            <line
              x1="0"
              y1="0"
              x2="24"
              y2="0"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          </svg>
        </motion.div>

        {/* Mind Score */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ScoreRing score={mindScore} pillar="mind" size={140} />
        </motion.div>
      </div>

      {/* Ember bar (streak) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 w-full max-w-md"
      >
        <EmberBar days={streakDays} />
      </motion.div>
    </div>
  );
}

// Compact version for smaller displays
export function ScoreDashboardCompact({
  bodyScore,
  mindScore,
  balanceIndex,
  className = '',
}: Omit<ScoreDashboardProps, 'streakDays'>) {
  return (
    <div className={`flex items-center justify-center gap-6 ${className}`}>
      <ScoreRing score={bodyScore} pillar="body" size={100} strokeWidth={6} />
      <ScoreRing score={balanceIndex} pillar="balance" size={60} strokeWidth={4} />
      <ScoreRing score={mindScore} pillar="mind" size={100} strokeWidth={6} />
    </div>
  );
}

// Vertical layout for mobile
export function ScoreDashboardVertical({
  bodyScore,
  mindScore,
  balanceIndex,
  streakDays,
  className = '',
}: ScoreDashboardProps) {
  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      {/* Balance at top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ScoreRing score={balanceIndex} pillar="balance" size={100} strokeWidth={6} />
      </motion.div>

      {/* Body and Mind side by side */}
      <div className="flex items-center gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ScoreRing score={bodyScore} pillar="body" size={120} strokeWidth={6} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <ScoreRing score={mindScore} pillar="mind" size={120} strokeWidth={6} />
        </motion.div>
      </div>

      {/* Ember bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full max-w-xs"
      >
        <EmberBar days={streakDays} />
      </motion.div>
    </div>
  );
}
