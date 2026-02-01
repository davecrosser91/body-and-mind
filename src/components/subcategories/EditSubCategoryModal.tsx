'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { CustomSubcategory } from './AddSubCategoryModal';

interface EditSubCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: CustomSubcategory) => void;
  onDelete: () => void;
  subcategory: CustomSubcategory | null;
  pillar: 'BODY' | 'MIND';
  availableSubcategories?: { key: string; name: string }[];
}

const PRESET_COLORS = [
  '#E8A854', // Gold
  '#7C9EE9', // Blue
  '#A855F7', // Purple
  '#22C55E', // Green
  '#EF4444', // Red
  '#F97316', // Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

export function EditSubCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  onDelete,
  subcategory,
  pillar,
  availableSubcategories = [],
}: EditSubCategoryModalProps) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [reassignTo, setReassignTo] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (subcategory) {
      setName(subcategory.name);
      setColor(subcategory.color);
      fetchActivitiesCount();
    }
  }, [subcategory]);

  const fetchActivitiesCount = async () => {
    if (!subcategory) return;

    try {
      const response = await fetch(`/api/v1/subcategories/${subcategory.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivitiesCount(data.data.activitiesCount || 0);
      }
    } catch {
      // Ignore errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subcategory) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/subcategories/${subcategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          color,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update subcategory');
        return;
      }

      onSuccess(data.data);
      handleClose();
    } catch {
      setError('Failed to update subcategory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!subcategory) return;

    setIsDeleting(true);
    setError(null);

    try {
      const url = reassignTo
        ? `/api/v1/subcategories/${subcategory.id}?reassignTo=${encodeURIComponent(reassignTo)}`
        : `/api/v1/subcategories/${subcategory.id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete subcategory');
        return;
      }

      onDelete();
      handleClose();
    } catch {
      setError('Failed to delete subcategory');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setColor(null);
    setError(null);
    setShowDeleteConfirm(false);
    setReassignTo('');
    onClose();
  };

  const pillarColor = pillar === 'BODY' ? '#E8A854' : '#7C9EE9';

  if (!subcategory) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-surface rounded-2xl p-6 border border-white/10">
              {!showDeleteConfirm ? (
                <>
                  <h2 className="text-xl font-bold text-text-primary mb-2">
                    Edit Category
                  </h2>
                  <p className="text-sm text-text-muted mb-4">
                    Update or delete this custom category
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-text-muted mb-2">Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Category name"
                          className="w-full px-4 py-3 bg-surface-light rounded-xl text-text-primary placeholder:text-text-muted border border-white/5 focus:border-white/20 focus:outline-none"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-text-muted mb-2">Color</label>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_COLORS.map((presetColor) => (
                            <button
                              key={presetColor}
                              type="button"
                              onClick={() => setColor(color === presetColor ? null : presetColor)}
                              className="w-8 h-8 rounded-full border-2 transition-all"
                              style={{
                                backgroundColor: presetColor,
                                borderColor: color === presetColor ? 'white' : 'transparent',
                                transform: color === presetColor ? 'scale(1.1)' : 'scale(1)',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {error && (
                      <p className="text-red-400 text-sm mt-4">{error}</p>
                    )}

                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-3 text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 text-text-muted bg-surface-light rounded-xl hover:bg-surface-lighter transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!name.trim() || isSubmitting}
                        className="flex-1 px-4 py-3 text-background rounded-xl font-medium disabled:opacity-50 transition-colors"
                        style={{ backgroundColor: color || pillarColor }}
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-text-primary mb-2">
                    Delete Category?
                  </h2>

                  {activitiesCount > 0 ? (
                    <>
                      <p className="text-sm text-text-muted mb-4">
                        This category has <span className="text-text-primary font-medium">{activitiesCount} activities</span>.
                        Choose where to move them:
                      </p>

                      <select
                        value={reassignTo}
                        onChange={(e) => setReassignTo(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-light rounded-xl text-text-primary border border-white/5 focus:border-white/20 focus:outline-none mb-4"
                      >
                        <option value="">Select a category...</option>
                        {availableSubcategories
                          .filter((s) => s.key !== subcategory.key)
                          .map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.name}
                            </option>
                          ))}
                      </select>
                    </>
                  ) : (
                    <p className="text-sm text-text-muted mb-4">
                      Are you sure you want to delete &quot;{subcategory.name}&quot;? This action cannot be undone.
                    </p>
                  )}

                  {error && (
                    <p className="text-red-400 text-sm mb-4">{error}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setReassignTo('');
                        setError(null);
                      }}
                      className="flex-1 px-4 py-3 text-text-muted bg-surface-light rounded-xl hover:bg-surface-lighter transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting || (activitiesCount > 0 && !reassignTo)}
                      className="flex-1 px-4 py-3 text-white bg-red-500 rounded-xl font-medium disabled:opacity-50 hover:bg-red-600 transition-colors"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
