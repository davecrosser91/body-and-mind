'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pillar } from '@prisma/client';
import type { SubCategory } from './CreateHabitWizard/types';
import { HabitCard } from './HabitCard';
import { CreateHabitWizard } from './CreateHabitWizard';
import { GlowButton } from '../ui/GlowButton';

export interface HabitNew {
  id: string;
  name: string;
  pillar: Pillar;
  subCategory: SubCategory;
  completedToday: boolean;
}

interface HabitListNewProps {
  habits: HabitNew[];
  onComplete: (habitId: string, details?: string) => Promise<void>;
  onUncomplete: (habitId: string) => Promise<void>;
  onHabitCreated?: (habit: HabitNew) => void;
  showAddButton?: boolean;
}

type PillarFilter = Pillar | 'ALL';

export function HabitListNew({
  habits,
  onComplete,
  onUncomplete,
  onHabitCreated,
  showAddButton = true,
}: HabitListNewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pillarFilter, setPillarFilter] = useState<PillarFilter>('ALL');
  const [loadingHabits, setLoadingHabits] = useState<Set<string>>(new Set());

  // Filter habits
  const filteredHabits = useMemo(() => {
    if (pillarFilter === 'ALL') return habits;
    return habits.filter(h => h.pillar === pillarFilter);
  }, [habits, pillarFilter]);

  // Group by pillar for display
  const groupedHabits = useMemo(() => {
    const body = filteredHabits.filter(h => h.pillar === 'BODY');
    const mind = filteredHabits.filter(h => h.pillar === 'MIND');
    return { body, mind };
  }, [filteredHabits]);

  // Stats
  const completedCount = habits.filter(h => h.completedToday).length;
  const totalCount = habits.length;

  const handleComplete = async (habitId: string, details?: string) => {
    setLoadingHabits(prev => new Set(prev).add(habitId));
    try {
      await onComplete(habitId, details);
    } finally {
      setLoadingHabits(prev => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    }
  };

  const handleUncomplete = async (habitId: string) => {
    setLoadingHabits(prev => new Set(prev).add(habitId));
    try {
      await onUncomplete(habitId);
    } finally {
      setLoadingHabits(prev => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    }
  };

  const handleHabitCreated = (habit: { id: string; name: string; pillar: Pillar; subCategory: SubCategory; points: number }) => {
    const newHabit: HabitNew = {
      id: habit.id,
      name: habit.name,
      pillar: habit.pillar,
      subCategory: habit.subCategory,
      completedToday: false,
    };
    onHabitCreated?.(newHabit);
    setShowCreateModal(false);
  };

  // Empty state
  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-light flex items-center justify-center">
          <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-text-secondary mb-2">No habits yet</p>
        <p className="text-text-muted text-sm mb-6">Create your first habit to start tracking</p>
        {showAddButton && (
          <GlowButton
            variant="body"
            onClick={() => setShowCreateModal(true)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Create Habit
          </GlowButton>
        )}

        <CreateHabitWizard
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleHabitCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Today&apos;s Habits</h2>
          <p className="text-sm text-text-muted mt-0.5">
            {completedCount} of {totalCount} completed
          </p>
        </div>

        {showAddButton && (
          <GlowButton
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add
          </GlowButton>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['ALL', 'BODY', 'MIND'] as PillarFilter[]).map((filter) => {
          const isSelected = pillarFilter === filter;
          const count = filter === 'ALL'
            ? habits.length
            : habits.filter(h => h.pillar === filter).length;

          return (
            <button
              key={filter}
              onClick={() => setPillarFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${isSelected
                  ? filter === 'BODY'
                    ? 'bg-body/20 text-body'
                    : filter === 'MIND'
                    ? 'bg-mind/20 text-mind'
                    : 'bg-surface-lighter text-text-primary'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-light'
                }
              `}
            >
              {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
              <span className="ml-1.5 text-xs opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-surface-light overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-body to-mind"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / totalCount) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Habit list - grouped by pillar when showing all */}
      {pillarFilter === 'ALL' ? (
        <div className="space-y-6">
          {/* Body habits */}
          {groupedHabits.body.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-body" />
                <h3 className="text-sm font-medium text-body">Body</h3>
                <span className="text-xs text-text-muted">
                  {groupedHabits.body.filter(h => h.completedToday).length}/{groupedHabits.body.length}
                </span>
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {groupedHabits.body.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      {...habit}
                      isCompleted={habit.completedToday}
                      isLoading={loadingHabits.has(habit.id)}
                      onComplete={handleComplete}
                      onUncomplete={handleUncomplete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Mind habits */}
          {groupedHabits.mind.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-mind" />
                <h3 className="text-sm font-medium text-mind">Mind</h3>
                <span className="text-xs text-text-muted">
                  {groupedHabits.mind.filter(h => h.completedToday).length}/{groupedHabits.mind.length}
                </span>
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {groupedHabits.mind.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      {...habit}
                      isCompleted={habit.completedToday}
                      isLoading={loadingHabits.has(habit.id)}
                      onComplete={handleComplete}
                      onUncomplete={handleUncomplete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Filtered view - flat list
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                {...habit}
                isCompleted={habit.completedToday}
                isLoading={loadingHabits.has(habit.id)}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty filter state */}
      {filteredHabits.length === 0 && habits.length > 0 && (
        <div className="text-center py-8">
          <p className="text-text-muted">No {pillarFilter.toLowerCase()} habits</p>
          <button
            onClick={() => setPillarFilter('ALL')}
            className="mt-2 text-sm text-body hover:underline"
          >
            Show all habits
          </button>
        </div>
      )}

      {/* Create modal */}
      <CreateHabitWizard
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleHabitCreated}
      />
    </div>
  );
}
