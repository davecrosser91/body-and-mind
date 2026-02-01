'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { WorkoutDetailForm } from './WorkoutDetailForm';

interface ExternalWorkout {
  id: string;
  source: string;
  externalId: string;
  name: string;
  workoutType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  strain?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  hrZones?: Record<string, number>;
}

interface TrainingTemplate {
  id: string;
  name: string;
  points: number;
  trainingDefaults?: {
    workoutType?: string;
    durationMinutes?: number;
    intensity?: string;
    muscleGroups?: string[];
    location?: string;
  } | null;
}

interface TrainingHabit {
  id: string;
  name: string;
  points: number;
}

interface TrainingLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogged: () => void;
}

const BODY_COLOR = '#E8A854';

type ViewMode = 'select' | 'detail';

export function TrainingLogModal({ isOpen, onClose, onLogged }: TrainingLogModalProps) {
  const { token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [externalWorkouts, setExternalWorkouts] = useState<ExternalWorkout[]>([]);
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [trainingHabits, setTrainingHabits] = useState<TrainingHabit[]>([]);

  // Selection state
  const [selectedExternalWorkout, setSelectedExternalWorkout] = useState<ExternalWorkout | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TrainingTemplate | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<TrainingHabit | null>(null);
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
      setViewMode('select');
      setSelectedExternalWorkout(null);
      setSelectedTemplate(null);
      setSelectedHabit(null);
      setLinkToHabitId(null);
      setShowHabitDropdown(null);
      setError(null);
      fetchData();
    }
  }, [isOpen]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      // Fetch external workouts, templates, and training habits in parallel
      const [externalRes, templatesRes, habitsRes] = await Promise.all([
        fetch('/api/v1/training/external-workouts', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/training/templates', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/activities?subCategory=TRAINING&habitsOnly=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (externalRes.ok) {
        const data = await externalRes.json();
        setExternalWorkouts(data.data || []);
      }

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.data || []);
      }

      if (habitsRes.ok) {
        const data = await habitsRes.json();
        // Filter to habits that haven't been completed today
        const habits = (data.data || []).filter((h: TrainingHabit & { completedToday?: boolean }) => !h.completedToday);
        setTrainingHabits(habits);
      }
    } catch (err) {
      console.error('Failed to fetch training data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleSelectExternalWorkout = (workout: ExternalWorkout, habitId?: string) => {
    setSelectedExternalWorkout(workout);
    setLinkToHabitId(habitId || null);
    setSelectedTemplate(null);
    setViewMode('detail');
    setShowHabitDropdown(null);
  };

  const handleSelectTemplate = (template: TrainingTemplate) => {
    setSelectedTemplate(template);
    setSelectedExternalWorkout(null);
    setLinkToHabitId(null);
    setViewMode('detail');
  };

  const handleSelectHabit = (habit: TrainingHabit) => {
    setSelectedHabit(habit);
    setLinkToHabitId(habit.id);
    setSelectedExternalWorkout(null);
    setSelectedTemplate(null);
    setViewMode('detail');
  };

  const handleCustomWorkout = () => {
    setSelectedExternalWorkout(null);
    setSelectedTemplate(null);
    setLinkToHabitId(null);
    setViewMode('detail');
  };

  const handleBack = () => {
    setViewMode('select');
    setSelectedExternalWorkout(null);
    setSelectedTemplate(null);
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
              style={{ borderBottomColor: `${BODY_COLOR}30` }}
            >
              <div className="flex items-center gap-3">
                {viewMode === 'detail' && (
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
                  {viewMode === 'select' ? 'Log Training' : 'Workout Details'}
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
                  {/* Training Habits Section - Primary */}
                  {trainingHabits.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Your Training Habits
                      </h3>
                      <div className="space-y-2">
                        {trainingHabits.map((habit) => (
                          <button
                            key={habit.id}
                            onClick={() => handleSelectHabit(habit)}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-light border border-surface-lighter hover:border-amber-500/50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">💪</span>
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

                  {/* External Workouts Section */}
                  {externalWorkouts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        From Whoop
                      </h3>
                      <div className="space-y-3">
                        {externalWorkouts.map((workout) => (
                          <div
                            key={workout.id}
                            className="bg-surface-light rounded-xl p-4 border border-surface-lighter"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">
                                    {workout.workoutType === 'STRENGTH' ? '🏋️' :
                                     workout.workoutType === 'CARDIO' ? '🏃' :
                                     workout.workoutType === 'HIIT' ? '⚡' :
                                     workout.workoutType === 'YOGA' ? '🧘' : '💪'}
                                  </span>
                                  <span className="font-medium text-text-primary">{workout.name}</span>
                                </div>
                                <div className="text-sm text-text-muted mt-1">
                                  {workout.durationMinutes} min
                                  {workout.strain && ` • Strain: ${workout.strain.toFixed(1)}`}
                                  {' • '}{formatTime(workout.startTime)}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleSelectExternalWorkout(workout)}
                                className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-surface hover:bg-surface-lighter transition-colors text-text-secondary"
                              >
                                Log as New
                              </button>
                              <div className="relative flex-1">
                                <button
                                  onClick={() => setShowHabitDropdown(showHabitDropdown === workout.id ? null : workout.id)}
                                  className="w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors text-white"
                                  style={{ backgroundColor: BODY_COLOR }}
                                >
                                  Link to Habit ▾
                                </button>
                                {showHabitDropdown === workout.id && trainingHabits.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-surface-lighter rounded-lg shadow-lg z-10 overflow-hidden">
                                    {trainingHabits.map((habit) => (
                                      <button
                                        key={habit.id}
                                        onClick={() => handleSelectExternalWorkout(workout, habit.id)}
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

                  {/* Templates Section */}
                  {templates.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Quick Templates
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {templates.slice(0, 6).map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleSelectTemplate(template)}
                            className="p-3 rounded-xl bg-surface-light border border-surface-lighter hover:border-amber-500/50 transition-all text-center"
                          >
                            <span className="block text-sm font-medium text-text-primary truncate">
                              {template.name}
                            </span>
                            <span className="block text-xs text-text-muted mt-1">
                              {template.points} pts
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divider - only show if there's content above */}
                  {(trainingHabits.length > 0 || externalWorkouts.length > 0 || templates.length > 0) && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-surface-lighter" />
                      <span className="text-sm text-text-muted">or</span>
                      <div className="flex-1 h-px bg-surface-lighter" />
                    </div>
                  )}

                  {/* Empty state message when no habits, workouts or templates */}
                  {trainingHabits.length === 0 && externalWorkouts.length === 0 && templates.length === 0 && !isLoading && (
                    <div className="text-center py-4">
                      <div className="text-3xl mb-3">💪</div>
                      <p className="text-text-secondary mb-1">No training habits yet</p>
                      <p className="text-sm text-text-muted">
                        Create a Training habit on the Habits page, or log a one-off workout below.
                      </p>
                    </div>
                  )}

                  {/* Custom Workout Button */}
                  <button
                    onClick={handleCustomWorkout}
                    className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-surface-lighter hover:border-amber-500/50 transition-colors text-text-secondary hover:text-text-primary"
                    style={{ borderColor: trainingHabits.length === 0 && externalWorkouts.length === 0 && templates.length === 0 ? `${BODY_COLOR}50` : undefined }}
                  >
                    <span className="text-lg mr-2">+</span>
                    Log One-Off Workout
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
                <WorkoutDetailForm
                  externalWorkout={selectedExternalWorkout}
                  template={selectedTemplate}
                  selectedHabit={selectedHabit}
                  linkToHabitId={linkToHabitId}
                  onComplete={handleLogComplete}
                  onCancel={handleBack}
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
