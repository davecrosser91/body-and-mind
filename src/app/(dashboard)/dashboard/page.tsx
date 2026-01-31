'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Pillar, SubCategory } from '@prisma/client';

// Daily components
import {
  DailyStatusCard,
  StreakUrgency,
  QuickActionsUrgent,
} from '@/components/daily';

// Habit components
import { HabitListNew, HabitNew } from '@/components/habits';

// UI components
import { GlassCard } from '@/components/ui/GlassCard';
import { EmberBar } from '@/components/scores/EmberBar';

// ============ TYPES ============

interface DailyStatusData {
  date: string;
  body: {
    completed: boolean;
    score: number;
    activities: { id: string; name: string; category: string; completedAt: string }[];
  };
  mind: {
    completed: boolean;
    score: number;
    activities: { id: string; name: string; category: string; completedAt: string }[];
  };
  streak: {
    current: number;
    atRisk: boolean;
    hoursRemaining: number;
  };
  recovery: {
    score: number | null;
    zone: 'green' | 'yellow' | 'red' | null;
    recommendation: string | null;
  } | null;
  quote: {
    text: string;
    author: string | null;
  };
}

interface QuickAction {
  activity: SubCategory;
  label: string;
  duration: string;
}

interface RecommendationsData {
  recovery: {
    score: number | null;
    zone: 'green' | 'yellow' | 'red' | null;
    suggestion: string;
    suggestedActivities: SubCategory[];
  };
  streakStatus: {
    current: number;
    atRisk: boolean;
    hoursRemaining: number;
    quickActions: QuickAction[];
  };
  nextInStack: {
    stackName: string;
    activity: SubCategory;
    afterCompleting: SubCategory | null;
  } | null;
  quote: {
    text: string;
    author: string | null;
  };
}

interface HabitFromAPI {
  id: string;
  name: string;
  category: string;
  completedToday: boolean;
}

// ============ HELPERS ============

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function categoryToPillar(category: string): Pillar {
  const bodyCategories = ['TRAINING', 'SLEEP', 'NUTRITION', 'FITNESS'];
  return bodyCategories.includes(category.toUpperCase()) ? 'BODY' : 'MIND';
}

function categoryToSubCategory(category: string): SubCategory {
  const categoryMap: Record<string, SubCategory> = {
    TRAINING: 'TRAINING',
    FITNESS: 'TRAINING',
    SLEEP: 'SLEEP',
    NUTRITION: 'NUTRITION',
    MEDITATION: 'MEDITATION',
    MINDFULNESS: 'MEDITATION',
    READING: 'READING',
    LEARNING: 'LEARNING',
    JOURNALING: 'JOURNALING',
  };
  return categoryMap[category.toUpperCase()] || 'TRAINING';
}

function getRecoveryZoneColor(zone: 'green' | 'yellow' | 'red' | null): string {
  switch (zone) {
    case 'green':
      return 'text-emerald-400';
    case 'yellow':
      return 'text-amber-400';
    case 'red':
      return 'text-red-400';
    default:
      return 'text-text-muted';
  }
}

function getRecoveryZoneBg(zone: 'green' | 'yellow' | 'red' | null): string {
  switch (zone) {
    case 'green':
      return 'bg-emerald-500/10 border-emerald-500/20';
    case 'yellow':
      return 'bg-amber-500/10 border-amber-500/20';
    case 'red':
      return 'bg-red-500/10 border-red-500/20';
    default:
      return 'bg-surface-light border-white/5';
  }
}

// ============ LOADING SKELETON ============

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 pb-8">
      {/* Streak */}
      <div className="flex flex-col items-center gap-2">
        <div className="h-10 w-24 bg-surface-light rounded-lg" />
        <div className="h-4 w-48 bg-surface-light rounded" />
      </div>

      {/* Daily Status */}
      <div className="h-44 bg-surface-light rounded-2xl" />

      {/* Recovery */}
      <div className="h-24 bg-surface-light rounded-2xl" />

      {/* Habits */}
      <div className="space-y-3">
        <div className="h-6 w-32 bg-surface-light rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-surface-light rounded-xl" />
        ))}
      </div>

      {/* Ember Bar */}
      <div className="h-12 bg-surface-light rounded-lg" />
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function DashboardPage() {
  const router = useRouter();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStatus, setDailyStatus] = useState<DailyStatusData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [habits, setHabits] = useState<HabitNew[]>([]);
  const [quickActionLoading, setQuickActionLoading] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [statusRes, recsRes, habitsRes] = await Promise.all([
        fetch('/api/v1/daily-status'),
        fetch('/api/v1/recommendations'),
        fetch('/api/v1/habits'),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setDailyStatus(statusData.data);
      }

      if (recsRes.ok) {
        const recsData = await recsRes.json();
        setRecommendations(recsData.data);
      }

      if (habitsRes.ok) {
        const habitsData = await habitsRes.json();
        // Transform API habits to HabitNew format
        const transformedHabits: HabitNew[] = habitsData.data.map((h: HabitFromAPI) => ({
          id: h.id,
          name: h.name,
          pillar: categoryToPillar(h.category),
          subCategory: categoryToSubCategory(h.category),
          completedToday: h.completedToday,
        }));
        setHabits(transformedHabits);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data after actions
  const refreshData = useCallback(async () => {
    // Fetch fresh status and recommendations
    const [statusRes, recsRes] = await Promise.all([
      fetch('/api/v1/daily-status'),
      fetch('/api/v1/recommendations'),
    ]);

    if (statusRes.ok) {
      const statusData = await statusRes.json();
      setDailyStatus(statusData.data);
    }

    if (recsRes.ok) {
      const recsData = await recsRes.json();
      setRecommendations(recsData.data);
    }
  }, []);

  // Handle quick action (log activity)
  const handleQuickAction = async (activity: string) => {
    setQuickActionLoading(true);
    try {
      // Determine pillar from activity
      const bodyActivities = ['TRAINING', 'SLEEP', 'NUTRITION'];
      const pillar = bodyActivities.includes(activity) ? 'BODY' : 'MIND';

      const res = await fetch('/api/v1/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pillar,
          category: activity,
          source: 'manual',
        }),
      });

      if (res.ok) {
        // Refresh all data
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to log quick action:', error);
    } finally {
      setQuickActionLoading(false);
    }
  };

  // Handle habit completion
  const handleHabitComplete = async (habitId: string, details?: string) => {
    try {
      const res = await fetch(`/api/v1/habits/${habitId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ details }),
      });

      if (res.ok) {
        // Update local state optimistically
        setHabits((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, completedToday: true } : h))
        );
        // Refresh status data
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to complete habit:', error);
    }
  };

  // Handle habit uncomplete
  const handleHabitUncomplete = async (habitId: string) => {
    try {
      const res = await fetch(`/api/v1/habits/${habitId}/complete`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Update local state
        setHabits((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, completedToday: false } : h))
        );
        // Refresh status data
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to uncomplete habit:', error);
    }
  };

  // Handle habit created
  const handleHabitCreated = (habit: HabitNew) => {
    setHabits((prev) => [...prev, { ...habit, completedToday: false }]);
  };

  // Navigation handlers
  const handleBodyClick = () => router.push('/body');
  const handleMindClick = () => router.push('/mind');

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Prepare quick actions for urgent display
  const quickActions = recommendations?.streakStatus.quickActions.map((qa) => ({
    activity: qa.activity,
    label: qa.label,
    duration: qa.duration,
    pillar: ['TRAINING', 'SLEEP', 'NUTRITION'].includes(qa.activity)
      ? ('body' as const)
      : ('mind' as const),
  })) || [];

  const streakAtRisk = dailyStatus?.streak.atRisk ?? false;
  const streakCurrent = dailyStatus?.streak.current ?? 0;
  const hoursRemaining = dailyStatus?.streak.hoursRemaining ?? 24;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold text-text-primary">{getGreeting()}</h1>
        <p className="text-text-muted mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </motion.header>

      {/* Streak Urgency - shows streak count, quote, and urgency state */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <StreakUrgency
          current={streakCurrent}
          atRisk={streakAtRisk}
          hoursRemaining={hoursRemaining}
          bodyComplete={dailyStatus?.body.completed ?? false}
          mindComplete={dailyStatus?.mind.completed ?? false}
          quote={dailyStatus?.quote.text}
        />
      </motion.section>

      {/* Daily Status Card - Body/Mind score rings with completion badges */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DailyStatusCard
          body={{
            completed: dailyStatus?.body.completed ?? false,
            score: dailyStatus?.body.score ?? 0,
            activities: dailyStatus?.body.activities.length ?? 0,
          }}
          mind={{
            completed: dailyStatus?.mind.completed ?? false,
            score: dailyStatus?.mind.score ?? 0,
            activities: dailyStatus?.mind.activities.length ?? 0,
          }}
          onBodyClick={handleBodyClick}
          onMindClick={handleMindClick}
        />
      </motion.section>

      {/* Recovery Card (if Whoop connected) */}
      {dailyStatus?.recovery && dailyStatus.recovery.score !== null && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <GlassCard
            hover={false}
            className={`p-4 border ${getRecoveryZoneBg(dailyStatus.recovery.zone)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-lighter flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Whoop Recovery</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {dailyStatus.recovery.recommendation}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-2xl font-bold ${getRecoveryZoneColor(
                    dailyStatus.recovery.zone
                  )}`}
                >
                  {dailyStatus.recovery.score}%
                </span>
                <p
                  className={`text-xs capitalize ${getRecoveryZoneColor(
                    dailyStatus.recovery.zone
                  )}`}
                >
                  {dailyStatus.recovery.zone} zone
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.section>
      )}

      {/* Quick Actions (if streak at risk) */}
      {streakAtRisk && quickActions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <QuickActionsUrgent
            actions={quickActions}
            onAction={handleQuickAction}
            visible={!quickActionLoading}
            hoursRemaining={hoursRemaining}
          />
        </motion.section>
      )}

      {/* Next in Stack Card (if active stacks) */}
      {recommendations?.nextInStack && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <GlassCard hover={false} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-body/20 to-mind/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-text-muted">
                    {recommendations.nextInStack.stackName}
                  </p>
                  <p className="text-sm font-medium text-text-primary">
                    Next: {recommendations.nextInStack.activity.toLowerCase().replace('_', ' ')}
                  </p>
                  {recommendations.nextInStack.afterCompleting && (
                    <p className="text-xs text-text-muted">
                      After completing{' '}
                      {recommendations.nextInStack.afterCompleting.toLowerCase().replace('_', ' ')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleQuickAction(recommendations.nextInStack!.activity)}
                disabled={quickActionLoading}
                className="px-3 py-1.5 rounded-lg bg-body/10 text-body text-sm font-medium hover:bg-body/20 transition-colors disabled:opacity-50"
              >
                Log it
              </button>
            </div>
          </GlassCard>
        </motion.section>
      )}

      {/* Today's Habits */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard hover={false} className="p-6">
          <HabitListNew
            habits={habits}
            onComplete={handleHabitComplete}
            onUncomplete={handleHabitUncomplete}
            onHabitCreated={handleHabitCreated}
            showAddButton={true}
          />
        </GlassCard>
      </motion.section>

      {/* Ember Indicator at bottom - shows streak with visual intensity */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <EmberBar days={streakCurrent} showParticles={streakCurrent >= 14} />
      </motion.section>
    </motion.div>
  );
}
