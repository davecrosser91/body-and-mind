'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { MeditationDetailForm } from './MeditationDetailForm';

interface ExternalMeditation {
  id: string;
  source: string;
  externalId: string;
  name: string;
  durationMinutes: number;
  startTime: string;
}

interface MeditationHabit {
  id: string;
  name: string;
  points: number;
}

interface MeditationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogged: () => void;
  quickAdd?: boolean;
}

const MIND_COLOR = '#7C9EE9';

type ViewMode = 'select' | 'detail';

export function MeditationLogModal({ isOpen, onClose, onLogged, quickAdd = false }: MeditationLogModalProps) {
  const { token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(quickAdd ? 'detail' : 'select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [externalMeditations, setExternalMeditations] = useState<ExternalMeditation[]>([]);
  const [meditationHabits, setMeditationHabits] = useState<MeditationHabit[]>([]);

  // Selection state
  const [selectedExternalMeditation, setSelectedExternalMeditation] = useState<ExternalMeditation | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<MeditationHabit | null>(null);
  const [linkToHabitId, setLinkToHabitId] = useState<string | null>(null);
  const [showHabitDropdown, setShowHabitDropdown] = useState<string | null>(null);

  // Handle SSR
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode(quickAdd ? 'detail' : 'select');
      setSelectedExternalMeditation(null);
      setSelectedHabit(null);
      setLinkToHabitId(null);
      setShowHabitDropdown(null);
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
      // Fetch external meditations and meditation habits in parallel
      const [externalRes, habitsRes] = await Promise.all([
        fetch('/api/v1/meditation/external', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/activities?subCategory=MEDITATION&habitsOnly=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (externalRes.ok) {
        const data = await externalRes.json();
        setExternalMeditations(data.data || []);
      }

      if (habitsRes.ok) {
        const data = await habitsRes.json();
        // Filter to habits that haven't been completed today
        const habits = (data.data || []).filter((h: MeditationHabit & { completedToday?: boolean }) => !h.completedToday);
        setMeditationHabits(habits);
      }
    } catch (err) {
      console.error('Failed to fetch meditation data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleSelectExternalMeditation = (meditation: ExternalMeditation, habitId?: string) => {
    setSelectedExternalMeditation(meditation);
    setLinkToHabitId(habitId || null);
    setSelectedHabit(null);
    setViewMode('detail');
    setShowHabitDropdown(null);
  };

  const handleSelectHabit = (habit: MeditationHabit) => {
    setSelectedHabit(habit);
    setLinkToHabitId(habit.id);
    setSelectedExternalMeditation(null);
    setViewMode('detail');
  };

  const handleCustomMeditation = () => {
    setSelectedExternalMeditation(null);
    setSelectedHabit(null);
    setLinkToHabitId(null);
    setViewMode('detail');
  };

  const handleBack = () => {
    setViewMode('select');
    setSelectedExternalMeditation(null);
    setSelectedHabit(null);
    setLinkToHabitId(null);
    setShowHabitDropdown(null);
  };

  const handleLogComplete = () => {
    onLogged();
    onClose();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                {viewMode === 'detail' && !quickAdd && (
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
                  {viewMode === 'select' ? 'Log Meditation' : 'Meditation Details'}
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
                  {/* Meditation Habits Section - Primary */}
                  {meditationHabits.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Your Meditation Habits
                      </h3>
                      <div className="space-y-2">
                        {meditationHabits.map((habit) => (
                          <button
                            key={habit.id}
                            onClick={() => handleSelectHabit(habit)}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-light border border-surface-lighter hover:border-opacity-50 transition-all"
                            style={{ '--hover-border': MIND_COLOR } as React.CSSProperties}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">🧘</span>
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

                  {/* External Meditations Section */}
                  {externalMeditations.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        From Whoop
                      </h3>
                      <div className="space-y-3">
                        {externalMeditations.map((meditation) => (
                          <div
                            key={meditation.id}
                            className="bg-surface-light rounded-xl p-4 border border-surface-lighter"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🌬️</span>
                                  <span className="font-medium text-text-primary">{meditation.name}</span>
                                </div>
                                <div className="text-sm text-text-muted mt-1">
                                  {meditation.durationMinutes} min • {formatTime(meditation.startTime)}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleSelectExternalMeditation(meditation)}
                                className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-surface hover:bg-surface-lighter transition-colors text-text-secondary"
                              >
                                Log as New
                              </button>
                              <div className="relative flex-1">
                                <button
                                  onClick={() => setShowHabitDropdown(showHabitDropdown === meditation.id ? null : meditation.id)}
                                  className="w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors text-white"
                                  style={{ backgroundColor: MIND_COLOR }}
                                >
                                  Link to Habit ▾
                                </button>
                                {showHabitDropdown === meditation.id && meditationHabits.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-surface-lighter rounded-lg shadow-lg z-10 overflow-hidden">
                                    {meditationHabits.map((habit) => (
                                      <button
                                        key={habit.id}
                                        onClick={() => handleSelectExternalMeditation(meditation, habit.id)}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface-light transition-colors text-text-primary"
                                      >
                                        {habit.name} ({habit.points} pts)
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divider - only show if there's content above */}
                  {(meditationHabits.length > 0 || externalMeditations.length > 0) && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-surface-lighter" />
                      <span className="text-sm text-text-muted">or</span>
                      <div className="flex-1 h-px bg-surface-lighter" />
                    </div>
                  )}

                  {/* Empty state message when no habits or external meditations */}
                  {meditationHabits.length === 0 && externalMeditations.length === 0 && !isLoading && (
                    <div className="text-center py-4">
                      <div className="text-3xl mb-3">🧘</div>
                      <p className="text-text-secondary mb-1">No meditation habits yet</p>
                      <p className="text-sm text-text-muted">
                        Create a Meditation habit on the Habits page, or log a one-off session below.
                      </p>
                    </div>
                  )}

                  {/* Custom Meditation Button */}
                  <button
                    onClick={handleCustomMeditation}
                    className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-surface-lighter hover:border-opacity-50 transition-colors text-text-secondary hover:text-text-primary"
                    style={{ borderColor: meditationHabits.length === 0 && externalMeditations.length === 0 ? `${MIND_COLOR}50` : undefined }}
                  >
                    <span className="text-lg mr-2">+</span>
                    Log Custom Meditation
                  </button>

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
                <MeditationDetailForm
                  externalMeditation={selectedExternalMeditation}
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
