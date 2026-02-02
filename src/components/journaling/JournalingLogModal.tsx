'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { JournalEntryForm } from './JournalEntryForm';

interface JournalingHabit {
  id: string;
  name: string;
  points: number;
}

interface JournalingLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogged: () => void;
  quickAdd?: boolean;
}

const MIND_COLOR = '#7C9EE9';

const DAILY_PROMPTS = [
  "What made you smile today?",
  "What are you grateful for?",
  "What's one thing you learned today?",
  "What would make today great?",
  "What's on your mind right now?",
  "How are you really feeling?",
  "What's something you're proud of?",
];

type ViewMode = 'select' | 'entry';

export function JournalingLogModal({ isOpen, onClose, onLogged, quickAdd = false }: JournalingLogModalProps) {
  const { token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(quickAdd ? 'entry' : 'select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [journalingHabits, setJournalingHabits] = useState<JournalingHabit[]>([]);
  const [dailyPrompt] = useState(() =>
    DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)]
  );

  // Selection state
  const [selectedHabit, setSelectedHabit] = useState<JournalingHabit | null>(null);
  const [linkToHabitId, setLinkToHabitId] = useState<string | null>(null);

  // Handle SSR
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode(quickAdd ? 'entry' : 'select');
      setSelectedHabit(null);
      setLinkToHabitId(null);
      setError(null);
      if (!quickAdd) {
        fetchData();
      }
    }
  }, [isOpen, quickAdd]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/activities?subCategory=JOURNALING&habitsOnly=true', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter to habits that haven't been completed today
        const habits = (data.data || []).filter((h: JournalingHabit & { completedToday?: boolean }) => !h.completedToday);
        setJournalingHabits(habits);
      }
    } catch (err) {
      console.error('Failed to fetch journaling data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleSelectHabit = (habit: JournalingHabit) => {
    setSelectedHabit(habit);
    setLinkToHabitId(habit.id);
    setViewMode('entry');
  };

  const handleNewEntry = () => {
    setSelectedHabit(null);
    setLinkToHabitId(null);
    setViewMode('entry');
  };

  const handleBack = () => {
    setViewMode('select');
    setSelectedHabit(null);
    setLinkToHabitId(null);
  };

  const handleLogComplete = () => {
    onLogged();
    onClose();
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
            className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-surface-lighter overflow-hidden max-h-[90vh] flex flex-col"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div
              className="px-6 py-4 border-b border-surface-lighter flex items-center justify-between shrink-0"
              style={{ borderBottomColor: `${MIND_COLOR}30` }}
            >
              <div className="flex items-center gap-3">
                {viewMode === 'entry' && !quickAdd && (
                  <button
                    onClick={handleBack}
                    className="p-1 text-text-muted hover:text-text-secondary rounded-lg hover:bg-surface-light transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <h2 className="text-lg font-semibold text-text-primary">
                  {viewMode === 'select' ? 'Journal' : 'Write Entry'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-text-secondary rounded-lg hover:bg-surface-light transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {viewMode === 'select' ? (
                <div className="p-6 space-y-6">
                  {/* Daily Prompt Card */}
                  <motion.button
                    onClick={handleNewEntry}
                    className="w-full p-5 rounded-2xl border-2 border-dashed text-left transition-all hover:bg-surface-light"
                    style={{ borderColor: `${MIND_COLOR}50` }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${MIND_COLOR}20` }}
                      >
                        <span className="text-2xl">✨</span>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted mb-1">Today&apos;s prompt</p>
                        <p className="text-text-primary font-medium">{dailyPrompt}</p>
                        <p className="text-sm mt-2" style={{ color: MIND_COLOR }}>
                          Start writing →
                        </p>
                      </div>
                    </div>
                  </motion.button>

                  {/* Journaling Habits Section */}
                  {journalingHabits.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Your Journaling Habits
                      </h3>
                      <div className="space-y-2">
                        {journalingHabits.map((habit) => (
                          <button
                            key={habit.id}
                            onClick={() => handleSelectHabit(habit)}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-light border border-surface-lighter hover:border-opacity-50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">📝</span>
                              <span className="font-medium text-text-primary">{habit.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-text-muted">{habit.points} pts</span>
                              <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {journalingHabits.length === 0 && !isLoading && (
                    <div className="text-center py-2">
                      <p className="text-sm text-text-muted">
                        Create a Journaling habit on the Habits page to track regular entries.
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}

                  {/* Loading */}
                  {isLoading && (
                    <div className="text-center text-text-muted py-4">
                      Loading...
                    </div>
                  )}
                </div>
              ) : (
                <JournalEntryForm
                  selectedHabit={selectedHabit}
                  linkToHabitId={linkToHabitId}
                  quickAdd={quickAdd}
                  onComplete={handleLogComplete}
                  onCancel={quickAdd ? onClose : handleBack}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
