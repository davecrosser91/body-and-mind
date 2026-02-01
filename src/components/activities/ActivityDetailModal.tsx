'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSubcategoryConfig, getSubcategoriesForPillar } from '@/lib/subcategories';

interface Activity {
  id: string;
  name: string;
  pillar: string;
  subCategory: string;
  points: number;
  isHabit: boolean;
  description?: string;
  frequency?: string;
}

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Activity>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ActivityDetailModal({
  activity,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: ActivityDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [points, setPoints] = useState(25);
  const [isHabit, setIsHabit] = useState(false);

  // Reset form when activity changes
  useEffect(() => {
    if (activity) {
      setName(activity.name);
      setSubCategory(activity.subCategory);
      setPoints(activity.points);
      setIsHabit(activity.isHabit);
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [activity]);

  if (!activity) return null;

  const pillar = activity.pillar as 'BODY' | 'MIND';
  const pillarColor = pillar === 'BODY' ? '#E8A854' : '#5BCCB3';
  const config = getSubcategoryConfig(activity.subCategory);
  const categoryColor = config?.color ?? pillarColor;
  const categories = getSubcategoriesForPillar(pillar);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(activity.id, {
        name,
        subCategory,
        points,
        isHabit,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update activity:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(activity.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete activity:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-surface border border-surface-lighter rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div
              className="px-6 py-4 border-b border-surface-lighter"
              style={{ backgroundColor: `${categoryColor}10` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      {isEditing ? 'Edit Activity' : 'Activity Details'}
                    </h2>
                    <p className="text-xs text-text-muted">
                      {config?.label ?? activity.subCategory}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {isEditing ? (
                /* Edit Form */
                <>
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-surface-light border border-surface-lighter text-text-primary focus:outline-none focus:border-white/30"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Category
                    </label>
                    <select
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-surface-light border border-surface-lighter text-text-primary focus:outline-none focus:border-white/30"
                    >
                      {categories.map((cat) => {
                        const catConfig = getSubcategoryConfig(cat);
                        return (
                          <option key={cat} value={cat}>
                            {catConfig?.label ?? cat}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Points */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                      min={1}
                      max={100}
                      className="w-full px-4 py-2 rounded-xl bg-surface-light border border-surface-lighter text-text-primary focus:outline-none focus:border-white/30"
                    />
                  </div>

                  {/* Is Habit */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-text-secondary">
                      Track as habit
                    </span>
                    <button
                      onClick={() => setIsHabit(!isHabit)}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        isHabit ? '' : 'bg-surface-light'
                      }`}
                      style={isHabit ? { backgroundColor: categoryColor } : {}}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                          isHabit ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </>
              ) : (
                /* View Mode */
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-surface-lighter">
                      <span className="text-text-muted">Name</span>
                      <span className="text-text-primary font-medium">{activity.name}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-surface-lighter">
                      <span className="text-text-muted">Category</span>
                      <span className="text-text-primary">{config?.label ?? activity.subCategory}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-surface-lighter">
                      <span className="text-text-muted">Points</span>
                      <span style={{ color: categoryColor }}>{activity.points} pts</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-surface-lighter">
                      <span className="text-text-muted">Type</span>
                      <span className="text-text-primary">
                        {activity.isHabit ? 'Habit' : 'Activity'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-text-muted">Pillar</span>
                      <span style={{ color: pillarColor }}>{pillar}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Delete Confirmation */}
              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/30"
                  >
                    <p className="text-red-400 text-sm mb-3">
                      Are you sure you want to delete this activity? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-4 py-2 rounded-lg bg-surface-light text-text-secondary text-sm font-medium hover:bg-surface-lighter transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-surface-lighter flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2 rounded-xl bg-surface-light text-text-secondary font-medium hover:bg-surface-lighter transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !name.trim()}
                    className="flex-1 px-4 py-2 rounded-xl text-background font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: categoryColor }}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-2 rounded-xl text-background font-medium transition-colors"
                    style={{ backgroundColor: categoryColor }}
                  >
                    Edit Activity
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
