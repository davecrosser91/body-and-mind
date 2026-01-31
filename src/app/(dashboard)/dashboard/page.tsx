'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScoreDashboard } from '@/components/scores/ScoreDashboard';
import { ScoreReveal, useScoreReveal } from '@/components/scores/ScoreReveal';
import { ScoreBreakdown } from '@/components/scores/ScoreBreakdown';
import { HabitListNew, HabitNew } from '@/components/habits';
import { GlassCard } from '@/components/ui/GlassCard';
import { Pillar, SubCategory } from '@prisma/client';

// Get greeting based on time
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-8 bg-surface-light rounded w-48" />
      <div className="flex justify-center gap-8">
        <div className="w-36 h-36 rounded-full bg-surface-light" />
        <div className="w-20 h-20 rounded-full bg-surface-light" />
        <div className="w-36 h-36 rounded-full bg-surface-light" />
      </div>
      <div className="h-2 bg-surface-light rounded w-full max-w-md mx-auto" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-surface-light rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Demo data - in real app, this comes from API
const DEMO_SCORES = {
  bodyScore: 72,
  mindScore: 85,
  balanceIndex: 78,
  streakDays: 12,
  subScores: {
    trainingScore: 80,
    sleepScore: 75,
    nutritionScore: 60,
    meditationScore: 90,
    readingScore: 85,
    learningScore: 80,
  },
};

const DEMO_HABITS: HabitNew[] = [
  { id: '1', name: 'Morning Workout', pillar: 'BODY' as Pillar, subCategory: 'TRAINING' as SubCategory, completedToday: true },
  { id: '2', name: 'Healthy Breakfast', pillar: 'BODY' as Pillar, subCategory: 'NUTRITION' as SubCategory, completedToday: false },
  { id: '3', name: 'Sleep by 10pm', pillar: 'BODY' as Pillar, subCategory: 'SLEEP' as SubCategory, completedToday: false },
  { id: '4', name: 'Meditation 10min', pillar: 'MIND' as Pillar, subCategory: 'MEDITATION' as SubCategory, completedToday: true },
  { id: '5', name: 'Read 30 pages', pillar: 'MIND' as Pillar, subCategory: 'READING' as SubCategory, completedToday: false },
  { id: '6', name: 'Duolingo Lesson', pillar: 'MIND' as Pillar, subCategory: 'LEARNING' as SubCategory, completedToday: true },
];

export default function NewDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [habits, setHabits] = useState<HabitNew[]>([]);
  const [scores, setScores] = useState(DEMO_SCORES);
  const { showReveal, dismissReveal } = useScoreReveal();
  const [userName] = useState('David');

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setHabits(DEMO_HABITS);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle habit completion
  const handleComplete = async (habitId: string, details?: string) => {
    setHabits(prev =>
      prev.map(h => h.id === habitId ? { ...h, completedToday: true } : h)
    );
    // In real app: POST to API
    console.log('Completed:', habitId, details);
  };

  const handleUncomplete = async (habitId: string) => {
    setHabits(prev =>
      prev.map(h => h.id === habitId ? { ...h, completedToday: false } : h)
    );
    // In real app: DELETE to API
    console.log('Uncompleted:', habitId);
  };

  const handleHabitCreated = (habit: HabitNew) => {
    setHabits(prev => [...prev, { ...habit, completedToday: false }]);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      {/* Score reveal overlay */}
      <ScoreReveal
        bodyScore={scores.bodyScore}
        mindScore={scores.mindScore}
        balanceIndex={scores.balanceIndex}
        streakDays={scores.streakDays}
        isVisible={showReveal}
        onComplete={dismissReveal}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 pb-8"
        onClick={showReveal ? dismissReveal : undefined}
      >
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl font-bold text-text-primary">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-text-muted mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </motion.header>

        {/* Score Dashboard */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ScoreDashboard
            bodyScore={scores.bodyScore}
            mindScore={scores.mindScore}
            balanceIndex={scores.balanceIndex}
            streakDays={scores.streakDays}
          />
        </motion.section>

        {/* Score Breakdowns */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <ScoreBreakdown
            pillar="body"
            totalScore={scores.bodyScore}
            subScores={[
              { key: 'training', label: 'Training', score: scores.subScores.trainingScore },
              { key: 'sleep', label: 'Sleep', score: scores.subScores.sleepScore },
              { key: 'nutrition', label: 'Nutrition', score: scores.subScores.nutritionScore },
            ]}
          />
          <ScoreBreakdown
            pillar="mind"
            totalScore={scores.mindScore}
            subScores={[
              { key: 'meditation', label: 'Meditation', score: scores.subScores.meditationScore },
              { key: 'reading', label: 'Reading', score: scores.subScores.readingScore },
              { key: 'learning', label: 'Learning', score: scores.subScores.learningScore },
            ]}
          />
        </motion.section>

        {/* Today's Habits */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard hover={false} className="p-6">
            <HabitListNew
              habits={habits}
              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
              onHabitCreated={handleHabitCreated}
              showAddButton={true}
            />
          </GlassCard>
        </motion.section>

        {/* Quick Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-4"
        >
          <GlassCard hover={false} className="p-4 text-center">
            <p className="text-2xl font-bold text-body">
              {habits.filter(h => h.completedToday).length}
            </p>
            <p className="text-xs text-text-muted mt-1">Completed</p>
          </GlassCard>
          <GlassCard hover={false} className="p-4 text-center">
            <p className="text-2xl font-bold text-mind">
              {habits.length}
            </p>
            <p className="text-xs text-text-muted mt-1">Total Habits</p>
          </GlassCard>
          <GlassCard hover={false} className="p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">
              {scores.streakDays}
            </p>
            <p className="text-xs text-text-muted mt-1">Day Streak</p>
          </GlassCard>
        </motion.section>
      </motion.div>
    </>
  );
}
