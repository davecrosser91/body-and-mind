'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

type ActivityType = 'training' | 'meditation' | 'journaling' | 'body' | 'mind';

interface AddActivityPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: ActivityType) => void;
}

const BODY_COLOR = '#E8A854';
const MIND_COLOR = '#5BCCB3';

const ACTIVITY_OPTIONS: { type: ActivityType; label: string; description: string; color: string; icon: React.ReactNode }[] = [
  {
    type: 'training',
    label: 'Training',
    description: 'Log a workout with details',
    color: BODY_COLOR,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 1 1 2 2 2h12c1 0 2-1 2-2V7M4 7c0-1 1-2 2-2h12c1 0 2 1 2 2M4 7h16M9 11h.01M15 11h.01M9 15h6" />
      </svg>
    ),
  },
  {
    type: 'meditation',
    label: 'Meditation',
    description: 'Log a mindfulness session',
    color: MIND_COLOR,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    type: 'journaling',
    label: 'Journaling',
    description: 'Write a journal entry',
    color: MIND_COLOR,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    type: 'body',
    label: 'Other Body Activity',
    description: 'Sleep, nutrition, etc.',
    color: BODY_COLOR,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    type: 'mind',
    label: 'Other Mind Activity',
    description: 'Reading, learning, etc.',
    color: MIND_COLOR,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export function AddActivityPicker({ isOpen, onClose, onSelect }: AddActivityPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-surface-lighter overflow-hidden"
            initial={{ scale: 0.95, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 50 }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-lighter flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Log Activity</h2>
              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-text-secondary rounded-lg hover:bg-surface-light transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Options */}
            <div className="p-4 space-y-2">
              {ACTIVITY_OPTIONS.map((option, index) => (
                <motion.button
                  key={option.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onSelect(option.type);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-light hover:bg-surface-lighter transition-colors text-left group"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${option.color}20`, color: option.color }}
                  >
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{option.label}</p>
                    <p className="text-sm text-text-muted">{option.description}</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-text-muted group-hover:text-text-secondary transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

export type { ActivityType };
