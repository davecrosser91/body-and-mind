'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AnimatedCounter } from '../ui/AnimatedCounter';

// Simple chevron icon component
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

interface SubScore {
  key: string;
  label: string;
  score: number;
  icon?: string;
}

interface ScoreBreakdownProps {
  pillar: 'body' | 'mind';
  totalScore: number;
  subScores: SubScore[];
  expandedByDefault?: boolean;
  className?: string;
}

const pillarStyles = {
  body: {
    bg: 'bg-body/10',
    border: 'border-body/20',
    text: 'text-body',
    bar: 'bg-body',
  },
  mind: {
    bg: 'bg-mind/10',
    border: 'border-mind/20',
    text: 'text-mind',
    bar: 'bg-mind',
  },
};

// Icons for sub-categories
const subCategoryIcons: Record<string, string> = {
  training: 'M3 3h18v18H3V3zm16 16V5H5v14h14zM7 12l3-3 3 3 5-5v9H7v-4z',
  sleep: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z',
  nutrition: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  meditation: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
  reading: 'M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z',
  learning: 'M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z',
  journaling: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
};

export function ScoreBreakdown({
  pillar,
  totalScore,
  subScores,
  expandedByDefault = false,
  className = '',
}: ScoreBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(expandedByDefault);
  const styles = pillarStyles[pillar];

  return (
    <div
      className={`rounded-xl ${styles.bg} border ${styles.border} overflow-hidden ${className}`}
    >
      {/* Header - clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-lg font-semibold ${styles.text}`}>
            {pillar === 'body' ? 'Body' : 'Mind'}
          </span>
          <AnimatedCounter
            value={totalScore}
            className={`text-2xl font-bold ${styles.text}`}
          />
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="w-5 h-5 text-text-muted" />
        </motion.div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {subScores.map((sub, index) => (
                <motion.div
                  key={sub.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  {/* Icon */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-text-muted flex-shrink-0"
                  >
                    <path d={subCategoryIcons[sub.key] || subCategoryIcons.learning} />
                  </svg>

                  {/* Label and bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-secondary truncate">
                        {sub.label}
                      </span>
                      <span className="text-sm font-medium text-text-primary ml-2">
                        {sub.score}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-surface-lighter overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${styles.bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${sub.score}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline breakdown for dashboard (always visible, compact)
export function ScoreBreakdownInline({
  pillar,
  subScores,
  className = '',
}: {
  pillar: 'body' | 'mind';
  subScores: SubScore[];
  className?: string;
}) {
  const styles = pillarStyles[pillar];

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {subScores.map((sub) => (
        <div key={sub.key} className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-text-muted"
          >
            <path d={subCategoryIcons[sub.key] || subCategoryIcons.learning} />
          </svg>
          <span className={`text-sm font-medium ${styles.text}`}>{sub.score}</span>
        </div>
      ))}
    </div>
  );
}
