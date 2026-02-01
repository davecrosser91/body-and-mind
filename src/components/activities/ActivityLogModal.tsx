'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSubcategoriesForPillar, getSubcategoryConfig } from '@/lib/subcategories';

type Pillar = 'BODY' | 'MIND';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogged: () => void;
  pillar: Pillar;
  customCategories?: string[];
}

const BODY_COLOR = '#E8A854';
const MIND_COLOR = '#5BCCB3';

export function ActivityLogModal({
  isOpen,
  onClose,
  onLogged,
  pillar,
  customCategories = [],
}: ActivityLogModalProps) {
  const [name, setName] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [points, setPoints] = useState(25);
  const [isHabit, setIsHabit] = useState(false);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const color = pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;

  // Get predefined subcategories for this pillar
  const predefinedSubcategories = getSubcategoriesForPillar(pillar);

  // Combine predefined subcategories with custom ones
  const allSubcategories = [
    ...predefinedSubcategories,
    ...customCategories.filter(c => !predefinedSubcategories.includes(c.toUpperCase())),
  ];

  // Handle SSR
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedSubcategory('');
      setPoints(25);
      setIsHabit(false);
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter an activity name');
      return;
    }

    if (!selectedSubcategory) {
      setError('Please select a category');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create the activity
      const createResponse = await fetch('/api/v1/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          pillar,
          subCategory: selectedSubcategory,
          points,
          isHabit,
          description: notes.trim() || undefined,
        }),
      });

      if (!createResponse.ok) {
        const data = await createResponse.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to create activity');
      }

      const activityData = await createResponse.json();
      const activityId = activityData.data?.id || activityData.id;

      if (!activityId) {
        throw new Error('Failed to get activity ID');
      }

      // Step 2: Complete the activity immediately
      const completeResponse = await fetch(`/api/v1/activities/${activityId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          details: notes.trim() || undefined,
          source: 'MANUAL',
        }),
      });

      if (!completeResponse.ok) {
        const data = await completeResponse.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to log activity completion');
      }

      onLogged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log activity');
    } finally {
      setIsLoading(false);
    }
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
            className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-surface-lighter overflow-hidden"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div
              className="px-6 py-4 border-b border-surface-lighter flex items-center justify-between"
              style={{ borderBottomColor: `${color}30` }}
            >
              <h2 className="text-lg font-semibold text-text-primary">
                Log {pillar === 'BODY' ? 'Body' : 'Mind'} Activity
              </h2>
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
              {/* Activity Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Activity Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Morning run, Read for 30 min"
                  className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                    text-text-primary placeholder-text-muted
                    focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': color } as React.CSSProperties}
                />
              </div>

              {/* Subcategory Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                      text-text-primary appearance-none cursor-pointer
                      focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': color } as React.CSSProperties}
                  >
                    <option value="">Select a category...</option>
                    {allSubcategories.map((subcat) => {
                      const config = getSubcategoryConfig(subcat);
                      const label = config?.label || subcat;
                      return (
                        <option key={subcat} value={subcat}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Points Input */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Points <span className="text-text-muted font-normal">(1-100)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setPoints(Math.min(100, Math.max(1, val)));
                      }
                    }}
                    min="1"
                    max="100"
                    className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                      text-text-primary placeholder-text-muted
                      focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': color } as React.CSSProperties}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
                    pts
                  </span>
                </div>
              </div>

              {/* Save as Habit Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-text-secondary">
                    Save as recurring habit
                  </label>
                  <p className="text-xs text-text-muted mt-0.5">
                    Show in quick-log next time
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHabit(!isHabit)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isHabit ? '' : 'bg-surface-lighter'
                  }`}
                  style={{ backgroundColor: isHabit ? color : undefined }}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      isHabit ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Notes <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any details..."
                  rows={2}
                  className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                    text-text-primary placeholder-text-muted resize-none
                    focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': color } as React.CSSProperties}
                />
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-400"
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
                  disabled={isLoading || !name.trim() || !selectedSubcategory}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-background transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: color }}
                >
                  {isLoading ? 'Logging...' : 'Log Activity'}
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
