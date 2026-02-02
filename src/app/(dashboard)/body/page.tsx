'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ScoreRing } from '@/components/scores/ScoreRing';
import { ActivityDetailModal } from '@/components/activities';
import { ActivityLogModal } from '@/components/activities/ActivityLogModal';
import { TrainingLogModal } from '@/components/training';
import { NutritionLogModal, type NutritionData } from '@/components/nutrition';
import { RecoveryCard, SleepCard } from '@/components/whoop';
import { getSubcategoryConfig } from '@/lib/subcategories';
import { POINTS_THRESHOLD } from '@/lib/points';
import { useAuth } from '@/hooks/useAuth';
import { DateNavigation } from '@/components/navigation';

/**
 * Check if a date is today
 */
function isDateToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============ CONSTANTS ============

const BODY_COLOR = '#E8A854';

// ============ TYPES ============

interface Activity {
  id: string;
  name: string;
  pillar: string;
  subCategory: string;
  points: number;
  isHabit: boolean;
}

interface TrainingDetails {
  workoutType: string | null;
  durationMinutes: number | null;
  intensity: string | null;
  muscleGroups?: string[];
  calories?: number | null;
  rpe?: number | null;
}

interface ActivityLog {
  id: string;
  activityId: string;
  activityName: string;
  subCategory: string;
  pointsEarned: number;
  completedAt: string;
  trainingDetails: TrainingDetails | null;
}

interface CompletedActivity {
  id: string;
  name: string;
  category: string;
  completedAt: string;
}

interface DailyStatusData {
  date: string;
  body: {
    completed: boolean;
    score: number;
    activities: CompletedActivity[];
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
}

// ============ LOADING SKELETON ============

function BodyPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-surface-light rounded-lg" />
        <div className="h-8 w-24 bg-surface-light rounded" />
      </div>

      {/* Main Score */}
      <div className="flex justify-center py-8">
        <div className="w-[200px] h-[200px] bg-surface-light rounded-full" />
      </div>

      {/* Cards */}
      <div className="h-40 bg-surface-light rounded-2xl" />
      <div className="h-32 bg-surface-light rounded-2xl" />
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function BodyPage() {
  const router = useRouter();
  const { token } = useAuth();

  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [dailyStatus, setDailyStatus] = useState<DailyStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [loggingActivityId, setLoggingActivityId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Nutrition state
  const [proteinGrams, setProteinGrams] = useState<number>(0);
  const [mealQuality, setMealQuality] = useState<{
    breakfast: 'healthy' | 'okay' | 'bad' | null;
    lunch: 'healthy' | 'okay' | 'bad' | null;
    dinner: 'healthy' | 'okay' | 'bad' | null;
  }>({
    breakfast: null,
    lunch: null,
    dinner: null,
  });

  // Derived state
  const isToday = isDateToday(selectedDate);
  const bodyPoints = dailyStatus?.body.score ?? 0;
  const streak = dailyStatus?.streak.current ?? 0;

  // Get completed activity IDs for today
  const completedActivityIds = new Set(
    (dailyStatus?.body.activities ?? []).map((a) => a.id)
  );

  // Group activities by subcategory
  const groupedActivities = activities.reduce<Record<string, Activity[]>>((acc, activity) => {
    const cat = activity.subCategory.toUpperCase();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(activity);
    return acc;
  }, {});

  // Get categories sorted
  const categories = Object.keys(groupedActivities).sort();

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const dateStr = formatDateParam(selectedDate);
      const dateParam = isDateToday(selectedDate) ? '' : `?date=${dateStr}`;

      const [activitiesRes, statusRes, logsRes] = await Promise.all([
        fetch('/api/v1/activities?pillar=BODY', { headers }),
        fetch(`/api/v1/daily-status${dateParam}`, { headers }),
        fetch(`/api/v1/activity-logs?pillar=BODY&date=${dateStr}`, { headers }),
      ]);

      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data.data);
      }

      if (statusRes.ok) {
        const data = await statusRes.json();
        setDailyStatus(data.data);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setActivityLogs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [notification]);

  // Quick log handler
  const handleQuickLog = async (activityId: string) => {
    setLoggingActivityId(activityId);
    try {
      const res = await fetch(`/api/v1/activities/${activityId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Activity logged!' });
        fetchData();
      } else {
        setNotification({ type: 'error', message: 'Failed to log activity' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to log activity' });
    } finally {
      setLoggingActivityId(null);
    }
  };

  // Handle uncomplete (toggle off)
  const handleUncomplete = async (activityId: string) => {
    setLoggingActivityId(activityId);
    try {
      const res = await fetch(`/api/v1/activities/${activityId}/complete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setNotification({ type: 'success', message: 'Completion removed' });
        fetchData();
      } else {
        const error = await res.json();
        setNotification({
          type: 'error',
          message: error.message || 'Failed to remove completion',
        });
      }
    } catch (error) {
      console.error('Uncomplete error:', error);
      setNotification({ type: 'error', message: 'Failed to remove completion' });
    } finally {
      setLoggingActivityId(null);
    }
  };

  // Handle activity selection (for edit/delete)
  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };

  // Handle activity update
  const handleActivityUpdate = async (id: string, data: Partial<Activity>) => {
    try {
      const res = await fetch(`/api/v1/activities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setNotification({ type: 'success', message: 'Activity updated!' });
        fetchData();
        setSelectedActivity((prev) => (prev ? { ...prev, ...data } : null));
      } else {
        const error = await res.json();
        setNotification({
          type: 'error',
          message: error.message || 'Failed to update activity',
        });
      }
    } catch (error) {
      console.error('Update error:', error);
      setNotification({ type: 'error', message: 'Failed to update activity' });
    }
  };

  // Handle activity delete
  const handleActivityDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/activities/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setNotification({ type: 'success', message: 'Activity deleted!' });
        setShowDetailModal(false);
        setSelectedActivity(null);
        fetchData();
      } else {
        const error = await res.json();
        setNotification({
          type: 'error',
          message: error.message || 'Failed to delete activity',
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setNotification({ type: 'error', message: 'Failed to delete activity' });
    }
  };

  // Loading state
  if (isLoading) {
    return <BodyPageSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8 max-w-4xl mx-auto"
    >
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => router.push('/dashboard')}
          className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-lighter transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BODY_COLOR }}>
            Body
          </h1>
          <p className="text-text-muted text-sm">Physical wellness tracking</p>
        </div>
      </motion.header>

      {/* Date Navigation */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <DateNavigation
          currentDate={selectedDate}
          onDateChange={setSelectedDate}
          isToday={isToday}
          pillarColor={BODY_COLOR}
        />
      </motion.section>

      {/* Score Ring and Streak */}
      <motion.section
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center py-4"
      >
        <div className="relative">
          <ScoreRing score={bodyPoints} pillar="body" size={180} strokeWidth={10} showLabel={false} showScore={false} />
          {/* Points display in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: BODY_COLOR }}>
              {bodyPoints}
            </span>
            <span className="text-text-muted text-sm">/ {POINTS_THRESHOLD} pts</span>
          </div>
        </div>

        {/* Streak Display */}
        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-surface-light"
          >
            <svg
              className="w-5 h-5 text-amber-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span className="text-text-secondary font-medium">{streak} day streak</span>
            {dailyStatus?.streak.atRisk && (
              <span className="text-xs text-amber-400 ml-1">
                ({Math.round(dailyStatus.streak.hoursRemaining)}h left)
              </span>
            )}
          </motion.div>
        )}
      </motion.section>

      {/* Recovery Card - Centered */}
      {dailyStatus?.recovery && dailyStatus.recovery.score !== null && dailyStatus.recovery.zone && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="w-full max-w-md">
            <RecoveryCard
              data={{
                score: dailyStatus.recovery.score,
                zone: dailyStatus.recovery.zone,
                hrv: dailyStatus.recovery.hrv,
                restingHeartRate: dailyStatus.recovery.restingHeartRate,
                recommendation: dailyStatus.recovery.recommendation,
              }}
            />
          </div>
        </motion.section>
      )}

      {/* Sleep Card */}
      {dailyStatus?.whoop?.sleep && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <SleepCard data={dailyStatus.whoop.sleep} />
        </motion.section>
      )}

      {/* Nutrition Section */}
      {isToday && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface/60 backdrop-blur-lg rounded-2xl p-5 border border-white/5"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Nutrition</h3>
              <p className="text-xs text-text-muted">Track meals and protein</p>
            </div>
          </div>

          {/* Protein Tracking */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Protein</span>
              <span className="text-sm font-medium" style={{ color: BODY_COLOR }}>
                {proteinGrams}g
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="200"
                value={proteinGrams}
                onChange={(e) => setProteinGrams(parseInt(e.target.value))}
                className="flex-1 h-2 bg-surface-light rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${BODY_COLOR} 0%, ${BODY_COLOR} ${proteinGrams / 2}%, rgba(255,255,255,0.1) ${proteinGrams / 2}%)`,
                }}
              />
              <div className="flex gap-1">
                {[25, 50, 100, 150].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setProteinGrams(preset)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      proteinGrams === preset
                        ? 'bg-surface-lighter text-text-primary'
                        : 'text-text-muted hover:bg-surface-light'
                    }`}
                  >
                    {preset}g
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Meal Quality Tracking */}
          <div className="space-y-3">
            {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => {
              const mealLabels = {
                breakfast: 'Breakfast',
                lunch: 'Lunch',
                dinner: 'Dinner',
              };
              const currentQuality = mealQuality[meal];

              return (
                <div key={meal} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{mealLabels[meal]}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() =>
                        setMealQuality((prev) => ({
                          ...prev,
                          [meal]: prev[meal] === 'healthy' ? null : 'healthy',
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        currentQuality === 'healthy'
                          ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                          : 'bg-surface-light text-text-muted hover:bg-surface-lighter'
                      }`}
                    >
                      Healthy
                    </button>
                    <button
                      onClick={() =>
                        setMealQuality((prev) => ({
                          ...prev,
                          [meal]: prev[meal] === 'okay' ? null : 'okay',
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        currentQuality === 'okay'
                          ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30'
                          : 'bg-surface-light text-text-muted hover:bg-surface-lighter'
                      }`}
                    >
                      Okay
                    </button>
                    <button
                      onClick={() =>
                        setMealQuality((prev) => ({
                          ...prev,
                          [meal]: prev[meal] === 'bad' ? null : 'bad',
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        currentQuality === 'bad'
                          ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                          : 'bg-surface-light text-text-muted hover:bg-surface-lighter'
                      }`}
                    >
                      Bad
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Whoop Training Card - Strain from wearable */}
      {dailyStatus?.whoop?.training && dailyStatus.whoop.training.strain > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-surface/60 backdrop-blur-lg rounded-2xl p-5 border border-white/5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Day Strain</h3>
                <p className="text-xs text-text-muted">From Whoop</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-400">
                {dailyStatus.whoop.training.strain.toFixed(1)}
              </p>
              <p className="text-xs text-text-muted">{dailyStatus.whoop.training.calories} kcal</p>
            </div>
          </div>
          {dailyStatus.whoop.training.workouts.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-white/5">
              {dailyStatus.whoop.training.workouts.map((workout, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary capitalize">{workout.name}</span>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>{workout.duration} min</span>
                    <span>{workout.calories} kcal</span>
                    <span className="text-orange-400 font-medium">{workout.strain.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      )}

      {/* Historical data indicator */}
      {!isToday && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-2 px-4 rounded-lg bg-surface-light text-text-muted text-sm"
        >
          Viewing historical data for {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </motion.div>
      )}

      {/* All Activities - Grouped by Category */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        {/* Activities by Category */}
        {categories.length > 0 ? (
          categories.map((category, idx) => {
            const categoryActivities = groupedActivities[category] || [];
            const config = getSubcategoryConfig(category);
            const categoryColor = config?.color ?? BODY_COLOR;
            const categoryLabel = config?.label ?? category;
            const completedInCategory = categoryActivities.filter((a) =>
              completedActivityIds.has(a.id)
            ).length;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * (idx + 1) }}
                className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <h3 className="text-sm font-medium text-text-secondary">{categoryLabel}</h3>
                  <span className="text-xs text-text-muted ml-auto">
                    {completedInCategory}/{categoryActivities.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {categoryActivities.map((activity) => {
                    const isCompleted = completedActivityIds.has(activity.id);
                    const isCurrentlyLogging = loggingActivityId === activity.id;
                    const completionLog = activityLogs.find(
                      (log) => log.activityId === activity.id
                    );
                    const completionTime = completionLog
                      ? new Date(completionLog.completedAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : null;

                    // Get details for completed activities
                    const hasDetails = completionLog?.trainingDetails;

                    return (
                      <div
                        key={activity.id}
                        className={`rounded-xl transition-colors ${
                          isCompleted
                            ? 'bg-white/5'
                            : 'bg-surface-light hover:bg-surface-lighter'
                        }`}
                      >
                        {/* Main row */}
                        <div className="flex items-center justify-between py-3 px-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Toggle checkbox */}
                            {isToday && (
                              <button
                                onClick={() =>
                                  isCompleted
                                    ? handleUncomplete(activity.id)
                                    : handleQuickLog(activity.id)
                                }
                                disabled={isCurrentlyLogging}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                                  isCompleted ? '' : 'border-2 hover:border-opacity-60'
                                }`}
                                style={{
                                  backgroundColor: isCompleted ? categoryColor : 'transparent',
                                  borderColor: isCompleted ? categoryColor : 'rgba(255,255,255,0.2)',
                                }}
                              >
                                {isCurrentlyLogging ? (
                                  <svg
                                    className="w-4 h-4 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    style={{ color: isCompleted ? '#1a1a2e' : categoryColor }}
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                ) : isCompleted ? (
                                  <svg
                                    className="w-4 h-4 text-background"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                ) : null}
                              </button>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-medium truncate ${
                                    isCompleted ? 'text-text-muted' : 'text-text-primary'
                                  }`}
                                >
                                  {activity.name}
                                </span>
                                {activity.isHabit && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-text-muted flex-shrink-0">
                                    Habit
                                  </span>
                                )}
                              </div>
                              {isCompleted && completionTime && (
                                <span className="text-xs text-text-muted">
                                  Completed at {completionTime}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span
                              className={`text-sm font-medium ${
                                isCompleted ? 'text-text-muted' : ''
                              }`}
                              style={{ color: isCompleted ? undefined : categoryColor }}
                            >
                              {activity.points} pts
                            </span>

                            {/* Edit button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActivitySelect(activity);
                              }}
                              className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-lighter transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Training Details section for completed activities */}
                        {isCompleted && hasDetails && completionLog?.trainingDetails && (
                          <div className="px-4 pb-3 pt-2 border-t border-white/5 ml-9">
                            <div className="flex flex-wrap items-center gap-2">
                              {completionLog.trainingDetails.durationMinutes && (
                                <div className="flex items-center gap-1.5 text-sm text-text-primary">
                                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{completionLog.trainingDetails.durationMinutes} min</span>
                                </div>
                              )}
                              {completionLog.trainingDetails.workoutType && (
                                <span
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize"
                                  style={{ backgroundColor: `${categoryColor}25`, color: categoryColor }}
                                >
                                  {completionLog.trainingDetails.workoutType.replace(/_/g, ' ').toLowerCase()}
                                </span>
                              )}
                              {completionLog.trainingDetails.intensity && (
                                <span className="px-2.5 py-1 rounded-lg text-xs bg-white/5 text-text-secondary capitalize">
                                  {completionLog.trainingDetails.intensity.toLowerCase()}
                                </span>
                              )}
                              {completionLog.trainingDetails.rpe && (
                                <span className="px-2.5 py-1 rounded-lg text-xs bg-white/5 text-text-secondary">
                                  RPE {completionLog.trainingDetails.rpe}/10
                                </span>
                              )}
                              {completionLog.trainingDetails.calories && (
                                <span className="text-xs text-text-muted ml-auto">
                                  {completionLog.trainingDetails.calories} kcal
                                </span>
                              )}
                            </div>
                            {completionLog.trainingDetails.muscleGroups && completionLog.trainingDetails.muscleGroups.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {completionLog.trainingDetails.muscleGroups.map((muscle, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-full bg-surface-lighter text-text-muted capitalize"
                                  >
                                    {muscle.replace(/_/g, ' ').toLowerCase()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-center py-12"
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${BODY_COLOR}15` }}
            >
              <svg className="w-8 h-8" fill="none" stroke={BODY_COLOR} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-text-muted mb-2">No activities yet</p>
            <p className="text-sm text-text-muted/70">
              Create activities to track your body progress
            </p>
          </motion.div>
        )}
      </motion.section>

      {/* Activity Log Modal */}
      <ActivityLogModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        onLogged={() => {
          setShowActivityModal(false);
          fetchData();
          setNotification({ type: 'success', message: 'Activity logged!' });
        }}
        pillar="BODY"
      />

      {/* Training Log Modal */}
      <TrainingLogModal
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        onLogged={() => {
          setShowTrainingModal(false);
          fetchData();
          setNotification({ type: 'success', message: 'Training logged!' });
        }}
      />

      {/* Nutrition Log Modal */}
      <NutritionLogModal
        isOpen={showNutritionModal}
        onClose={() => setShowNutritionModal(false)}
        onLogged={(data: NutritionData) => {
          setProteinGrams(data.proteinGrams);
          setMealQuality(data.mealQuality);
          setNotification({ type: 'success', message: 'Nutrition logged!' });
        }}
        initialData={{ proteinGrams, mealQuality }}
      />

      {/* Activity Detail Modal (Edit/Delete) */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedActivity(null);
        }}
        onUpdate={handleActivityUpdate}
        onDelete={handleActivityDelete}
      />

      {/* Activity Picker Modal */}
      <AnimatePresence>
        {showActivityPicker && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowActivityPicker(false)}
            />
            {/* Picker */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-24 right-4 z-50 bg-surface rounded-2xl border border-white/10 shadow-xl overflow-hidden"
            >
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    setShowActivityPicker(false);
                    setShowTrainingModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-light transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Log Training</p>
                    <p className="text-xs text-text-muted">Workout with details</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowActivityPicker(false);
                    setShowNutritionModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-light transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Log Nutrition</p>
                    <p className="text-xs text-text-muted">Protein and meals</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowActivityPicker(false);
                    setShowActivityModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-light transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${BODY_COLOR}20` }}>
                    <svg className="w-5 h-5" style={{ color: BODY_COLOR }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Other Activity</p>
                    <p className="text-xs text-text-muted">Any body activity</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      {isToday && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowActivityPicker(!showActivityPicker)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 transition-transform"
          style={{ backgroundColor: BODY_COLOR }}
        >
          <motion.svg
            animate={{ rotate: showActivityPicker ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-7 h-7 text-background"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </motion.svg>
        </motion.button>
      )}
    </motion.div>
  );
}
