'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pillar, Frequency } from '@prisma/client';
import { useAuth } from '@/hooks/useAuth';

// SubCategory is now a string type
type SubCategory = 'TRAINING' | 'SLEEP' | 'NUTRITION' | 'MEDITATION' | 'READING' | 'LEARNING' | 'JOURNALING';

export interface CreateHabitFormData {
  name: string;
  pillar: Pillar;
  subCategory: SubCategory;
  description?: string;
  frequency: Frequency;
}

interface CreateHabitModalNewProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (habit: CreateHabitFormData & { id: string }) => void;
}

// Pillar configuration
const PILLAR_CONFIG: Record<Pillar, {
  label: string;
  subCategories: SubCategory[];
  accent: string;
  bg: string;
}> = {
  BODY: {
    label: 'Body',
    subCategories: ['TRAINING', 'SLEEP', 'NUTRITION'],
    accent: 'text-body',
    bg: 'bg-body/10',
  },
  MIND: {
    label: 'Mind',
    subCategories: ['MEDITATION', 'READING', 'LEARNING', 'JOURNALING'],
    accent: 'text-mind',
    bg: 'bg-mind/10',
  },
};

// SubCategory labels and icons
const SUBCATEGORY_CONFIG: Record<SubCategory, { label: string; icon: string }> = {
  TRAINING: { label: 'Training', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  SLEEP: { label: 'Sleep', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
  NUTRITION: { label: 'Nutrition', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  MEDITATION: { label: 'Meditation', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' },
  READING: { label: 'Reading', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  LEARNING: { label: 'Learning', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  JOURNALING: { label: 'Journaling', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
};

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'CUSTOM', label: 'Custom' },
];

export function CreateHabitModalNew({
  isOpen,
  onClose,
  onCreated,
}: CreateHabitModalNewProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState<CreateHabitFormData>({
    name: '',
    pillar: 'BODY',
    subCategory: 'TRAINING',
    description: '',
    frequency: 'DAILY',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle SSR - only render portal on client
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        pillar: 'BODY',
        subCategory: 'TRAINING',
        description: '',
        frequency: 'DAILY',
      });
      setError(null);
    }
  }, [isOpen]);

  // Update subCategory when pillar changes
  const handlePillarChange = (pillar: Pillar) => {
    const firstSubCategory = PILLAR_CONFIG[pillar].subCategories[0] ?? 'TRAINING';
    setFormData(prev => ({ ...prev, pillar, subCategory: firstSubCategory }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          pillar: formData.pillar,
          subCategory: formData.subCategory,
          description: formData.description?.trim() || null,
          frequency: formData.frequency.toLowerCase(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to create habit');
      }

      const data = await response.json();
      onCreated(data.habit);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create habit');
    } finally {
      setIsLoading(false);
    }
  };

  const pillarConfig = PILLAR_CONFIG[formData.pillar];

  // Don't render on server or when not mounted
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
            className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-surface-lighter overflow-hidden"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-lighter flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Create Habit</h2>
              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-text-secondary rounded-lg hover:bg-surface-light transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Morning workout"
                  className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                    text-text-primary placeholder-text-muted
                    focus:outline-none focus:ring-2 focus:ring-body focus:border-transparent"
                />
              </div>

              {/* Pillar Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Pillar
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['BODY', 'MIND'] as Pillar[]).map((pillar) => {
                    const config = PILLAR_CONFIG[pillar];
                    const isSelected = formData.pillar === pillar;
                    return (
                      <button
                        key={pillar}
                        type="button"
                        onClick={() => handlePillarChange(pillar)}
                        className={`px-4 py-3 rounded-xl border-2 font-medium transition-all
                          ${isSelected
                            ? pillar === 'BODY'
                              ? 'bg-body/20 border-body text-body'
                              : 'bg-mind/20 border-mind text-mind'
                            : 'bg-surface-light border-surface-lighter text-text-secondary hover:border-text-muted'
                          }
                        `}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SubCategory Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {pillarConfig.subCategories.map((subCat) => {
                    const config = SUBCATEGORY_CONFIG[subCat];
                    const isSelected = formData.subCategory === subCat;
                    return (
                      <button
                        key={subCat}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, subCategory: subCat }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                          ${isSelected
                            ? `${pillarConfig.bg} border-current ${pillarConfig.accent}`
                            : 'bg-surface-light border-surface-lighter text-text-secondary hover:text-text-primary'
                          }
                        `}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                        </svg>
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Frequency
                </label>
                <div className="flex gap-2">
                  {FREQUENCY_OPTIONS.map((option) => {
                    const isSelected = formData.frequency === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, frequency: option.value }))}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-all
                          ${isSelected
                            ? 'bg-surface-lighter border-text-muted text-text-primary'
                            : 'bg-surface-light border-surface-lighter text-text-secondary hover:text-text-primary'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description (optional) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add notes..."
                  rows={2}
                  className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                    text-text-primary placeholder-text-muted resize-none
                    focus:outline-none focus:ring-2 focus:ring-body focus:border-transparent"
                />
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-error"
                >
                  {error}
                </motion.p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-surface-lighter
                    text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all
                    ${formData.pillar === 'BODY'
                      ? 'bg-body text-background hover:bg-body-light'
                      : 'bg-mind text-background hover:bg-mind-light'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
