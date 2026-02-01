'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStacks, Stack } from './useStacks';
import { StackCard } from './StackCard';
import { CreateStackModal } from './CreateStackModal';
import { GlowButton } from '../ui/GlowButton';
import { CueType } from '@prisma/client';

const BODY_COLOR = '#E8A854';

type FilterType = 'ALL' | 'ACTIVE' | 'INACTIVE';

export function StacksView() {
  const { stacks, isLoading, error, createStack, toggleStack, deleteStack } = useStacks();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [loadingStackId, setLoadingStackId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredStacks = stacks.filter(stack => {
    switch (filter) {
      case 'ACTIVE': return stack.isActive;
      case 'INACTIVE': return !stack.isActive;
      default: return true;
    }
  });

  const activeCount = stacks.filter(s => s.isActive).length;

  const handleToggle = async (id: string) => {
    setLoadingStackId(id);
    await toggleStack(id);
    setLoadingStackId(null);
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }
    await deleteStack(id);
    setDeleteConfirmId(null);
  };

  const handleCreate = async (data: {
    name: string;
    description?: string;
    habitIds: string[];
    cueType?: CueType | null;
    cueValue?: string | null;
    completionBonus?: number;
  }) => {
    await createStack({
      name: data.name,
      description: data.description,
      habitIds: data.habitIds,
      cueType: data.cueType as 'TIME' | 'LOCATION' | 'AFTER_ACTIVITY' | null,
      cueValue: data.cueValue,
      completionBonus: data.completionBonus,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-surface-light rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-surface-light rounded-xl animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-9 w-20 bg-surface-light rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-surface-light rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-400/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-text-secondary mb-2">Failed to load stacks</p>
        <p className="text-sm text-text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Habit Stacks</h1>
          <p className="text-sm text-text-muted mt-1">
            {activeCount} active stack{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <GlowButton
          variant="body"
          onClick={() => setShowCreateModal(true)}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Create Stack
        </GlowButton>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { value: 'ALL', label: 'All', count: stacks.length },
          { value: 'ACTIVE', label: 'Active', count: activeCount },
          { value: 'INACTIVE', label: 'Inactive', count: stacks.length - activeCount },
        ] as { value: FilterType; label: string; count: number }[]).map(({ value, label, count }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              filter === value
                ? 'bg-body/20 text-body'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-light'
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs opacity-60">{count}</span>
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div
        className="p-4 rounded-xl border"
        style={{ backgroundColor: `${BODY_COLOR}05`, borderColor: `${BODY_COLOR}30` }}
      >
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke={BODY_COLOR} viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          <div>
            <p className="text-sm" style={{ color: BODY_COLOR }}>
              <strong>Habit Stacking</strong> chains your habits together into powerful routines.
              Complete all habits in order to earn bonus points. Build a streak for even more rewards!
            </p>
          </div>
        </div>
      </div>

      {/* Stack List */}
      {filteredStacks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-light flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-text-secondary mb-2">
            {stacks.length === 0 ? 'No stacks yet' : `No ${filter.toLowerCase()} stacks`}
          </p>
          <p className="text-sm text-text-muted">
            {stacks.length === 0
              ? 'Create your first stack to build powerful routines'
              : 'Try a different filter'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredStacks.map((stack) => (
              <StackCard
                key={stack.id}
                stack={stack}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isLoading={loadingStackId === stack.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Toast */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-surface-lighter rounded-xl shadow-lg p-4 flex items-center gap-4 z-50"
          >
            <p className="text-text-primary">Delete this stack?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <CreateStackModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreate}
      />
    </div>
  );
}
