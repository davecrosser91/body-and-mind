'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Pillar } from '@prisma/client';

// SubCategory is now a string type (no longer Prisma enum)
type SubCategory = 'TRAINING' | 'SLEEP' | 'NUTRITION' | 'MEDITATION' | 'READING' | 'LEARNING' | 'JOURNALING';

// Daily components
import {
  DailyStatusCard,
  StreakUrgency,
  QuickActionsUrgent,
} from '@/components/daily';

// Habit components
import { HabitListNew, HabitNew } from '@/components/habits';

// Activity components
import { AddActivityPicker, ActivityLogModal } from '@/components/activities';
import type { ActivityType } from '@/components/activities';
import { TrainingLogModal } from '@/components/training/TrainingLogModal';
import { MeditationLogModal } from '@/components/meditation/MeditationLogModal';
import { JournalingLogModal } from '@/components/journaling/JournalingLogModal';

// UI components
import { GlassCard } from '@/components/ui/GlassCard';
import { EmberBar } from '@/components/scores/EmberBar';

// Whoop components (keeping for potential future use)
// import { RecoveryCard, RecoveryCardCompact, SleepCard, TrainingCard, StrainCardCompact, WhoopConnectedCard } from '@/components/whoop';

// Auth
import { useAuth } from '@/hooks/useAuth';

// ============ TYPES ============

interface DailyStatusData {
  date: string;
  body: {
    completed: boolean;
    score: number;
    activities: { id: string; name: string; category: string; completedAt: string; points: number }[];
  };
  mind: {
    completed: boolean;
    score: number;
    activities: { id: string; name: string; category: string; completedAt: string; points: number }[];
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
    hrv: number | null;
    restingHeartRate: number | null;
  } | null;
  whoop: {
    connected: boolean;
    lastSync: string | null;
    sleep: {
      hours: number;
      efficiency: number;
      remHours: number;
      deepHours: number;
      performance: number;
    } | null;
    training: {
      strain: number;
      calories: number;
      workouts: {
        name: string;
        strain: number;
        duration: number;
        calories: number;
      }[];
    } | null;
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

interface ActivityFromAPI {
  id: string;
  name: string;
  pillar: 'BODY' | 'MIND';
  subCategory: string;
  points: number;
  isHabit: boolean;
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
  const { token } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStatus, setDailyStatus] = useState<DailyStatusData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [habits, setHabits] = useState<HabitNew[]>([]);
  const [quickActionLoading, setQuickActionLoading] = useState(false);

  // Activity modal states
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [showJournalingModal, setShowJournalingModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState<'BODY' | 'MIND' | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [statusRes, recsRes, habitsRes] = await Promise.all([
        fetch('/api/v1/daily-status', { headers }),
        fetch('/api/v1/recommendations', { headers }),
        fetch('/api/v1/activities?habitsOnly=true', { headers }),
      ]);

      // Parse responses once (can only call .json() once per Response)
      const statusData = statusRes.ok ? await statusRes.json() : null;
      const recsData = recsRes.ok ? await recsRes.json() : null;
      const habitsData = habitsRes.ok ? await habitsRes.json() : null;

      if (statusData) {
        setDailyStatus(statusData.data);
      }

      if (recsData) {
        setRecommendations(recsData.data);
      }

      if (habitsData && statusData) {
        // Get completed activity IDs from daily status
        const completedIds = new Set<string>([
          ...(statusData.data?.body?.activities || []).map((a: { id: string }) => a.id),
          ...(statusData.data?.mind?.activities || []).map((a: { id: string }) => a.id),
        ]);

        // Transform API activities to HabitNew format
        const transformedHabits: HabitNew[] = habitsData.data.map((h: ActivityFromAPI) => ({
          id: h.id,
          name: h.name,
          pillar: h.pillar,
          subCategory: h.subCategory as SubCategory,
          completedToday: completedIds.has(h.id),
        }));
        setHabits(transformedHabits);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [fetchData, token]);

  // Refresh data after actions
  const refreshData = useCallback(async () => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch fresh status and recommendations
    const [statusRes, recsRes] = await Promise.all([
      fetch('/api/v1/daily-status', { headers }),
      fetch('/api/v1/recommendations', { headers }),
    ]);

    if (statusRes.ok) {
      const statusData = await statusRes.json();
      setDailyStatus(statusData.data);
    }

    if (recsRes.ok) {
      const recsData = await recsRes.json();
      setRecommendations(recsData.data);
    }
  }, [token]);

  // Handle quick action (log activity)
  const handleQuickAction = async (activity: string) => {
    if (!token) return;

    setQuickActionLoading(true);
    try {
      // Determine pillar from activity
      const bodyActivities = ['TRAINING', 'SLEEP', 'NUTRITION'];
      const pillar = bodyActivities.includes(activity) ? 'BODY' : 'MIND';

      const res = await fetch('/api/v1/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
    if (!token) return;

    try {
      const res = await fetch(`/api/v1/activities/${habitId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
    if (!token) return;

    try {
      const res = await fetch(`/api/v1/activities/${habitId}/complete`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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

  // Activity picker handler
  const handleActivityTypeSelect = (type: ActivityType) => {
    switch (type) {
      case 'training':
        setShowTrainingModal(true);
        break;
      case 'meditation':
        setShowMeditationModal(true);
        break;
      case 'journaling':
        setShowJournalingModal(true);
        break;
      case 'body':
        setShowActivityModal('BODY');
        break;
      case 'mind':
        setShowActivityModal('MIND');
        break;
    }
  };

  // Handle activity logged
  const handleActivityLogged = () => {
    fetchData();
  };

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

      {/* Today's Habits & Activities */}
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

          {/* Completed Activities (non-habit activities logged today) */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-muted">Today&apos;s Completed Activities</h3>
              <button
                onClick={() => setShowActivityPicker(true)}
                className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>
            {dailyStatus && (dailyStatus.body.activities.length > 0 || dailyStatus.mind.activities.length > 0) ? (
              <>
                <div className="space-y-2">
                  {/* Body activities */}
                  {dailyStatus.body.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-light/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-body/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{activity.name}</p>
                        <p className="text-xs text-text-muted capitalize">{activity.category.toLowerCase()}</p>
                      </div>
                      <span className="text-sm font-medium text-body mr-2">+{activity.points}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-body/10 text-body">BODY</span>
                    </div>
                  ))}
                  {/* Mind activities */}
                  {dailyStatus.mind.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-light/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-mind/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-mind" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{activity.name}</p>
                        <p className="text-xs text-text-muted capitalize">{activity.category.toLowerCase()}</p>
                      </div>
                      <span className="text-sm font-medium text-mind mr-2">+{activity.points}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-mind/10 text-mind">MIND</span>
                    </div>
                  ))}
                </div>

                {/* Points Summary */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-sm text-text-muted">Total Points</span>
                  <div className="flex items-center gap-4">
                    {dailyStatus.body.score > 0 && (
                      <span className="text-sm font-medium text-body">{dailyStatus.body.score} Body</span>
                    )}
                    {dailyStatus.mind.score > 0 && (
                      <span className="text-sm font-medium text-mind">{dailyStatus.mind.score} Mind</span>
                    )}
                    <span className="text-lg font-bold text-text-primary">
                      {dailyStatus.body.score + dailyStatus.mind.score}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-text-muted text-center py-4">
                No activities logged yet. Tap + to add one!
              </p>
            )}
          </div>
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

      {/* Activity Picker Modal */}
      <AddActivityPicker
        isOpen={showActivityPicker}
        onClose={() => setShowActivityPicker(false)}
        onSelect={handleActivityTypeSelect}
      />

      {/* Training Modal */}
      <TrainingLogModal
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        onLogged={handleActivityLogged}
      />

      {/* Meditation Modal */}
      <MeditationLogModal
        isOpen={showMeditationModal}
        onClose={() => setShowMeditationModal(false)}
        onLogged={handleActivityLogged}
        quickAdd
      />

      {/* Journaling Modal */}
      <JournalingLogModal
        isOpen={showJournalingModal}
        onClose={() => setShowJournalingModal(false)}
        onLogged={handleActivityLogged}
        quickAdd
      />

      {/* Generic Activity Modal (Body/Mind) */}
      {showActivityModal && (
        <ActivityLogModal
          isOpen={true}
          onClose={() => setShowActivityModal(null)}
          onLogged={handleActivityLogged}
          pillar={showActivityModal}
        />
      )}
    </motion.div>
  );
}
