'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddSubCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
  pillar: 'BODY' | 'MIND';
}

export function AddSubCategoryModal({ isOpen, onClose, onAdd, pillar }: AddSubCategoryModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd(name.trim().toUpperCase());
      setName('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
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
            onClick={onClose}
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
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Yoga, Breathwork, Podcasts"
                  className="w-full px-4 py-3 bg-surface-light rounded-xl text-text-primary placeholder:text-text-muted border border-white/5 focus:border-white/20 focus:outline-none"
                  autoFocus
                />

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 text-text-muted bg-surface-light rounded-xl hover:bg-surface-lighter transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim() || isSubmitting}
                    className="flex-1 px-4 py-3 text-background rounded-xl font-medium disabled:opacity-50 transition-colors"
                    style={{ backgroundColor: pillarColor }}
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
