'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Pillar } from '@prisma/client';
import { HabitListNew, HabitNew } from '@/components/habits';
import { useAuth } from '@/hooks/useAuth';

// SubCategory is now a string type
type SubCategory = 'TRAINING' | 'SLEEP' | 'NUTRITION' | 'MEDITATION' | 'READING' | 'LEARNING' | 'JOURNALING';

export default function HabitsPage() {
  const { token } = useAuth();
  const [habits, setHabits] = useState<HabitNew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/v1/activities?habitsOnly=true', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch habits');
      }

      const data = await response.json();
      const items = data.data || [];
      // Map API response to HabitNew format
      const mappedHabits: HabitNew[] = items.map((h: {
        id: string;
        name: string;
        pillar?: Pillar;
        subCategory?: string;
        completedToday: boolean;
      }) => ({
        id: h.id,
        name: h.name,
        pillar: h.pillar || 'BODY',
        subCategory: h.subCategory || 'TRAINING',
        completedToday: h.completedToday,
      }));
      setHabits(mappedHabits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleComplete = async (habitId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/v1/activities/${habitId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Optimistic update
        setHabits(prev => prev.map(h =>
          h.id === habitId ? { ...h, completedToday: true } : h
        ));
      }
    } catch (err) {
      console.error('Failed to complete habit:', err);
    }
  };

  const handleUncomplete = async (habitId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/v1/activities/${habitId}/complete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Optimistic update
        setHabits(prev => prev.map(h =>
          h.id === habitId ? { ...h, completedToday: false } : h
        ));
      }
    } catch (err) {
      console.error('Failed to uncomplete habit:', err);
    }
  };

  const handleHabitCreated = (habit: HabitNew) => {
    setHabits(prev => [...prev, habit]);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface-light rounded" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-light rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-text-muted hover:text-text-primary underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Your Habits</h1>
          <p className="text-sm text-text-muted mt-1">
            Build consistency with daily Body & Mind habits
          </p>
        </div>
      </motion.div>

      {/* Habit List with integrated create button */}
      <HabitListNew
        habits={habits}
        onComplete={handleComplete}
        onUncomplete={handleUncomplete}
        onHabitCreated={handleHabitCreated}
        showAddButton={true}
      />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8"
      >
        <div className="bg-surface-light rounded-xl p-4 border border-white/5">
          <p className="text-sm text-text-muted">Total Habits</p>
          <p className="text-2xl font-bold text-text-primary">{habits.length}</p>
        </div>
        <div className="bg-surface-light rounded-xl p-4 border border-white/5">
          <p className="text-sm text-text-muted">Completed Today</p>
          <p className="text-2xl font-bold text-text-primary">
            {habits.filter((h) => h.completedToday).length}
          </p>
        </div>
        <div className="bg-surface-light rounded-xl p-4 border border-white/5">
          <p className="text-sm text-text-muted">Completion Rate</p>
          <p className="text-2xl font-bold text-text-primary">
            {habits.length > 0
              ? Math.round((habits.filter((h) => h.completedToday).length / habits.length) * 100)
              : 0}%
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
