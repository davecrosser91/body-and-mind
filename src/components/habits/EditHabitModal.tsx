'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pillar, Frequency } from '@prisma/client';
import { useAuth } from '@/hooks/useAuth';
import type { SubCategory } from './CreateHabitWizard/types';
import {
  BODY_SUBCATEGORIES,
  MIND_SUBCATEGORIES,
  SUBCATEGORY_CONFIG,
  POINTS_PRESETS,
  BODY_COLOR,
  MIND_COLOR,
} from './CreateHabitWizard/types';
import { AutoTriggerSection, AutoTriggerConfig } from './AutoTriggerSection';

interface HabitData {
  id: string;
  name: string;
  pillar: Pillar;
  subCategory: SubCategory;
  description?: string | null;
  points: number;
  frequency: Frequency;
}

interface EditHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: HabitData | null;
  onUpdated: (habit: HabitData) => void;
}

export function EditHabitModal({ isOpen, onClose, habit, onUpdated }: EditHabitModalProps) {
  const { token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [pillar, setPillar] = useState<Pillar>('BODY');
  const [subCategory, setSubCategory] = useState<SubCategory>('TRAINING');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(25);
  const [autoTrigger, setAutoTrigger] = useState<AutoTriggerConfig | null>(null);

  const color = pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;
  const subcategories = pillar === 'BODY' ? BODY_SUBCATEGORIES : MIND_SUBCATEGORIES;

  // Handle SSR
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch full habit details including autoTrigger when opening
  useEffect(() => {
    if (habit && isOpen && token) {
      setName(habit.name);
      setPillar(habit.pillar);
      setSubCategory(habit.subCategory);
      setDescription(habit.description || '');
      setPoints(habit.points);
      setError(null);

      // Fetch full details including autoTrigger
      setIsFetchingDetails(true);
      fetch(`/api/v1/activities/${habit.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.autoTrigger) {
            setAutoTrigger({
              triggerType: data.data.autoTrigger.triggerType,
              thresholdValue: data.data.autoTrigger.thresholdValue ?? undefined,
              workoutTypeId: data.data.autoTrigger.workoutTypeId ?? undefined,
              triggerActivityId: data.data.autoTrigger.triggerActivityId ?? undefined,
            });
          } else {
            setAutoTrigger(null);
          }
        })
        .catch(() => {
          setAutoTrigger(null);
        })
        .finally(() => {
          setIsFetchingDetails(false);
        });
    }
  }, [habit, isOpen, token]);

  // Reset subCategory when pillar changes
  useEffect(() => {
    if (pillar === 'BODY' && !BODY_SUBCATEGORIES.includes(subCategory)) {
      setSubCategory('TRAINING');
    } else if (pillar === 'MIND' && !MIND_SUBCATEGORIES.includes(subCategory)) {
      setSubCategory('MEDITATION');
    }
  }, [pillar, subCategory]);

  const handleSubmit = async () => {
    if (!token || !habit) return;
    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/activities/${habit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          pillar,
          subCategory,
          description: description.trim() || null,
          points,
          autoTrigger: autoTrigger
            ? {
                triggerType: autoTrigger.triggerType,
                thresholdValue: autoTrigger.thresholdValue,
                workoutTypeId: autoTrigger.workoutTypeId,
                triggerActivityId: autoTrigger.triggerActivityId,
              }
            : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to update habit');
      }

      const data = await response.json();
      onUpdated({
        id: habit.id,
        name: data.data.name,
        pillar: data.data.pillar,
        subCategory: data.data.subCategory,
        description: data.data.description,
        points: data.data.points,
        frequency: data.data.frequency,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update habit');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && habit && (
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
              style={{ borderBottomColor: `${color}30` }}
            >
              <h2 className="text-lg font-semibold text-text-primary">Edit Habit</h2>
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
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Morning meditation"
                  className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                    text-text-primary placeholder-text-muted
                    focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': color } as React.CSSProperties}
                />
              </div>

              {/* Pillar */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Pillar
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['BODY', 'MIND'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPillar(p)}
                      className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                        pillar === p
                          ? p === 'BODY'
                            ? 'border-body bg-body/10 text-body'
                            : 'border-mind bg-mind/10 text-mind'
                          : 'border-surface-lighter text-text-secondary hover:border-text-muted'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* SubCategory */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {subcategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSubCategory(cat)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        subCategory === cat
                          ? 'border-current bg-current/10'
                          : 'border-surface-lighter text-text-secondary hover:border-text-muted'
                      }`}
                      style={subCategory === cat ? { color } : undefined}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={SUBCATEGORY_CONFIG[cat].icon} />
                      </svg>
                      {SUBCATEGORY_CONFIG[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Points */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Points Value
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {POINTS_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setPoints(preset.value)}
                      className={`flex flex-col items-center px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        points === preset.value
                          ? 'border-current bg-current/10'
                          : 'border-surface-lighter text-text-secondary hover:border-text-muted'
                      }`}
                      style={points === preset.value ? { color } : undefined}
                    >
                      <span className="font-bold">{preset.value}</span>
                      <span className="text-xs opacity-70">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes or details..."
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                    text-text-primary placeholder-text-muted resize-none
                    focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': color } as React.CSSProperties}
                />
              </div>

              {/* Auto-Trigger Section */}
              {isFetchingDetails ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full" />
                  <span className="ml-2 text-sm text-text-muted">Loading trigger settings...</span>
                </div>
              ) : (
                <AutoTriggerSection
                  pillar={pillar}
                  trigger={autoTrigger}
                  onChange={setAutoTrigger}
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-surface-lighter flex gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-surface-lighter
                  text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: color, color: 'rgb(var(--background))' }}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
