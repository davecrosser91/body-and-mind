'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

export interface CustomSubcategory {
  id: string;
  userId: string;
  pillar: 'BODY' | 'MIND';
  name: string;
  key: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AddSubCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (subcategory: CustomSubcategory) => void;
  pillar: 'BODY' | 'MIND';
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

export function AddSubCategoryModal({ isOpen, onClose, onSuccess, pillar }: AddSubCategoryModalProps) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/subcategories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          pillar,
          color: color || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create subcategory');
        return;
      }

      onSuccess(data.data);
      setName('');
      setColor(null);
      onClose();
    } catch {
      setError('Failed to create subcategory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setColor(null);
    setError(null);
    onClose();
  };

  const pillarColor = pillar === 'BODY' ? '#E8A854' : '#7C9EE9';

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
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Add Custom Category
              </h2>
              <p className="text-sm text-text-muted mb-4">
                Create a new category for your {pillar.toLowerCase()} activities
              </p>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-muted mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Yoga, Breathwork, Podcasts"
                      className="w-full px-4 py-3 bg-surface-light rounded-xl text-text-primary placeholder:text-text-muted border border-white/5 focus:border-white/20 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-2">Color (optional)</label>
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
                    {isSubmitting ? 'Adding...' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
