'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

type UrgencyState = 'complete' | 'at_risk' | 'in_progress';

interface StreakUrgencyProps {
  current: number;
  atRisk: boolean;
  hoursRemaining?: number;
  bodyComplete: boolean;
  mindComplete: boolean;
  quote?: string;
  className?: string;
}

export function StreakUrgency({
  current,
  atRisk,
  hoursRemaining = 24,
  bodyComplete,
  mindComplete,
  quote,
  className = '',
}: StreakUrgencyProps) {
  // Determine urgency state
  const getUrgencyState = (): UrgencyState => {
    if (bodyComplete && mindComplete) return 'complete';
    if (atRisk) return 'at_risk';
    return 'in_progress';
  };

  const urgencyState = getUrgencyState();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Streak Counter */}
      <div className="flex items-center justify-center gap-2">
        <StreakFire count={current} urgencyState={urgencyState} />
      </div>

      {/* Status Message */}
      <AnimatePresence mode="wait">
        <StatusMessage
          key={urgencyState}
          urgencyState={urgencyState}
          hoursRemaining={hoursRemaining}
          bodyComplete={bodyComplete}
          mindComplete={mindComplete}
        />
      </AnimatePresence>

      {/* Quote (if provided) */}
      {quote && <RotatingQuote quote={quote} />}
    </div>
  );
}

interface StreakFireProps {
  count: number;
  urgencyState: UrgencyState;
}

function StreakFire({ count, urgencyState }: StreakFireProps) {
  const isAtRisk = urgencyState === 'at_risk';
  const isComplete = urgencyState === 'complete';

  return (
    <motion.div
      className="flex items-center gap-2"
      animate={isAtRisk ? { x: [-1, 1, -1, 1, 0] } : {}}
      transition={isAtRisk ? { duration: 0.5, repeat: Infinity, repeatDelay: 2 } : {}}
    >
      <motion.span
        className="text-3xl"
        animate={
          isComplete
            ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }
            : isAtRisk
            ? { opacity: [1, 0.5, 1] }
            : { scale: [1, 1.05, 1] }
        }
        transition={{
          duration: isComplete ? 0.5 : 1.5,
          repeat: Infinity,
          repeatDelay: isComplete ? 1 : 0,
          ease: 'easeInOut',
        }}
      >
        {isComplete ? '🔥' : isAtRisk ? '🔥' : '🔥'}
      </motion.span>

      <motion.span
        className={`
          text-2xl font-bold tabular-nums
          ${isComplete ? 'text-success' : isAtRisk ? 'text-error' : 'text-ember-bright'}
        `}
        key={count}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {count}
      </motion.span>

      <span className="text-text-muted text-sm">
        day{count !== 1 ? 's' : ''}
      </span>
    </motion.div>
  );
}

interface StatusMessageProps {
  urgencyState: UrgencyState;
  hoursRemaining: number;
  bodyComplete: boolean;
  mindComplete: boolean;
}

function StatusMessage({
  urgencyState,
  hoursRemaining,
  bodyComplete,
  mindComplete,
}: StatusMessageProps) {
  const getMessage = () => {
    switch (urgencyState) {
      case 'complete':
        return {
          text: 'Day complete! Streak secured.',
          color: 'text-success',
          icon: '✓',
        };
      case 'at_risk':
        return {
          text: `${hoursRemaining}h left to save your streak!`,
          color: 'text-error',
          icon: '⚠',
        };
      case 'in_progress':
        return {
          text: getMissingPillarMessage(bodyComplete, mindComplete),
          color: 'text-text-secondary',
          icon: null,
        };
    }
  };

  const message = getMessage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <div
        className={`
          flex items-center justify-center gap-2
          ${message.color}
          ${urgencyState === 'at_risk' ? 'font-medium' : ''}
        `}
      >
        {message.icon && (
          <motion.span
            animate={urgencyState === 'at_risk' ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {message.icon}
          </motion.span>
        )}
        <span className="text-sm">{message.text}</span>
      </div>

      {/* Progress indicator for in_progress state */}
      {urgencyState === 'in_progress' && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <PillarIndicator pillar="body" complete={bodyComplete} />
          <PillarIndicator pillar="mind" complete={mindComplete} />
        </div>
      )}
    </motion.div>
  );
}

function getMissingPillarMessage(bodyComplete: boolean, mindComplete: boolean): string {
  if (!bodyComplete && !mindComplete) {
    return 'Do something for Body & Mind today';
  }
  if (!bodyComplete) {
    return 'Complete a Body activity to secure your streak';
  }
  if (!mindComplete) {
    return 'Complete a Mind activity to secure your streak';
  }
  return 'Day complete!';
}

function PillarIndicator({ pillar, complete }: { pillar: 'body' | 'mind'; complete: boolean }) {
  const bgColor = pillar === 'body' ? 'bg-body' : 'bg-mind';
  const label = pillar === 'body' ? 'Body' : 'Mind';

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`
          w-3 h-3 rounded-full
          ${complete ? bgColor : 'bg-surface-lighter'}
          ${complete ? '' : 'border border-surface-lighter'}
        `}
      />
      <span className={`text-xs ${complete ? 'text-text-secondary' : 'text-text-muted'}`}>
        {label}
      </span>
    </div>
  );
}

interface RotatingQuoteProps {
  quote: string;
}

function RotatingQuote({ quote }: RotatingQuoteProps) {
  const [displayedQuote, setDisplayedQuote] = useState(quote);

  useEffect(() => {
    setDisplayedQuote(quote);
  }, [quote]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={displayedQuote}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
        className="text-center px-4 pt-2"
      >
        <p className="text-text-muted text-xs italic leading-relaxed">
          &ldquo;{displayedQuote}&rdquo;
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

// Compact variant for headers
export function StreakUrgencyCompact({
  current,
  atRisk,
  bodyComplete,
  mindComplete,
  className = '',
}: Omit<StreakUrgencyProps, 'hoursRemaining' | 'quote'>) {
  const isComplete = bodyComplete && mindComplete;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <motion.span
        className="text-lg"
        animate={atRisk && !isComplete ? { opacity: [1, 0.5, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        🔥
      </motion.span>
      <span
        className={`
          font-bold tabular-nums
          ${isComplete ? 'text-success' : atRisk ? 'text-error' : 'text-ember-bright'}
        `}
      >
        {current}
      </span>
    </div>
  );
}
