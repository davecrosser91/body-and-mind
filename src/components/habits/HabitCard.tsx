'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pillar } from '@prisma/client';
import type { SubCategory } from './CreateHabitWizard/types';

interface HabitCardProps {
  id: string;
  name: string;
  pillar: Pillar;
  subCategory: SubCategory;
  isCompleted: boolean;
  isLoading?: boolean;
  onComplete: (habitId: string, details?: string) => Promise<void>;
  onUncomplete: (habitId: string) => Promise<void>;
  onEdit?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
}

const pillarStyles = {
  BODY: {
    accent: 'text-body',
    bg: 'bg-body/10',
    border: 'border-body/20',
    glow: 'shadow-body-glow',
    ring: 'ring-body',
  },
  MIND: {
    accent: 'text-mind',
    bg: 'bg-mind/10',
    border: 'border-mind/20',
    glow: 'shadow-mind-glow',
    ring: 'ring-mind',
  },
};

const subCategoryLabels: Record<SubCategory, string> = {
  TRAINING: 'Training',
  SLEEP: 'Sleep',
  NUTRITION: 'Nutrition',
  MEDITATION: 'Meditation',
  READING: 'Reading',
  LEARNING: 'Learning',
  JOURNALING: 'Journaling',
};

const subCategoryIcons: Record<SubCategory, string> = {
  TRAINING: 'M13 10V3L4 14h7v7l9-11h-7z',
  SLEEP: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  NUTRITION: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  MEDITATION: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  READING: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  LEARNING: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  JOURNALING: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
};

export function HabitCard({
  id,
  name,
  pillar,
  subCategory,
  isCompleted,
  isLoading = false,
  onComplete,
  onUncomplete,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const styles = pillarStyles[pillar];

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleToggle = async () => {
    if (isLoading) return;

    if (isCompleted) {
      await onUncomplete(id);
    } else {
      // Quick complete without details
      await onComplete(id);
    }
  };

  const handleCompleteWithDetails = async () => {
    await onComplete(id, details);
    setShowDetails(false);
    setDetails('');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        relative rounded-xl p-4 transition-all duration-200
        bg-surface border border-surface-lighter
        hover:bg-surface-light hover:border-surface-lighter
        ${isCompleted ? styles.bg + ' ' + styles.border : ''}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <motion.button
          onClick={handleToggle}
          disabled={isLoading}
          whileTap={{ scale: 0.9 }}
          className={`
            relative w-6 h-6 rounded-full border-2 flex items-center justify-center
            transition-all duration-200 flex-shrink-0
            ${isCompleted
              ? `${styles.accent} border-current bg-current/20`
              : 'border-surface-lighter hover:border-text-muted'
            }
            ${isLoading ? 'opacity-50' : ''}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface ${styles.ring}
          `}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {isLoading ? (
            <svg className="animate-spin w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isCompleted ? (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`w-3 h-3 ${styles.accent}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </motion.svg>
          ) : null}
        </motion.button>

        {/* Category icon */}
        <div className={`flex-shrink-0 ${styles.accent}`}>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={subCategoryIcons[subCategory]} />
          </svg>
        </div>

        {/* Habit name */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${isCompleted ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
            {name}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {subCategoryLabels[subCategory]}
          </p>
        </div>

        {/* Pillar badge */}
        <span className={`
          px-2 py-1 rounded-lg text-xs font-medium
          ${styles.bg} ${styles.accent}
        `}>
          {pillar}
        </span>

        {/* Add details button (only when not completed) */}
        {!isCompleted && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-text-muted hover:text-text-secondary transition-colors"
            aria-label="Add details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={showDetails ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>
        )}

        {/* More options menu */}
        {(onEdit || onDelete) && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-text-muted hover:text-text-secondary transition-colors"
              aria-label="More options"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-full mt-1 z-20 bg-surface border border-surface-lighter rounded-lg shadow-lg overflow-hidden min-w-[120px]"
                >
                  {onEdit && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(id);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface-light flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(id);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Details input (expandable) */}
      {showDetails && !isCompleted && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 pt-4 border-t border-surface-lighter"
        >
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add details (optional)..."
            className="w-full bg-surface-light border border-surface-lighter rounded-lg p-3 text-sm
              text-text-primary placeholder-text-muted resize-none
              focus:outline-none focus:ring-1 focus:ring-body"
            rows={2}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowDetails(false)}
              className="px-3 py-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteWithDetails}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg ${
                pillar === 'BODY'
                  ? 'bg-body text-background hover:bg-body-light'
                  : 'bg-mind text-background hover:bg-mind-light'
              } transition-colors`}
            >
              Complete
            </button>
          </div>
        </motion.div>
      )}

      {/* Completion glow effect */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute inset-0 rounded-xl pointer-events-none ${styles.glow} opacity-30`}
        />
      )}
    </motion.div>
  );
}
