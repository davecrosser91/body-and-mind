'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ScoreRing } from '@/components/scores/ScoreRing';
import { ActivityLogModal, ActivityDetailModal } from '@/components/activities';
import { MeditationLogModal } from '@/components/meditation';
import { JournalingLogModal } from '@/components/journaling';
import { getSubcategoryConfig } from '@/lib/subcategories';
import { useAuth } from '@/hooks/useAuth';
import { DateNavigation } from '@/components/navigation';
import { MindFAB } from '@/components/navigation/MindFAB';

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

// ============ TYPES ============

interface Activity {
  id: string;
  name: string;
  pillar: string;
  subCategory: string;
  points: number;
  isHabit: boolean;
}

interface MeditationDetails {
  durationMinutes: number;
  technique: string | null;
  moodBefore: string | null;
  moodAfter: string | null;
}

interface JournalEntry {
  entryType: string;
  mood: string | null;
  content: string;
  wordCount: number;
}

interface TrainingDetails {
  workoutType: string | null;
  durationMinutes: number | null;
  intensity: string | null;
}

interface ActivityLog {
  id: string;
  activityId: string;
  activityName: string;
  subCategory: string;
  pointsEarned: number;
  completedAt: string;
  meditationDetails: MeditationDetails | null;
  journalEntry: JournalEntry | null;
  trainingDetails: TrainingDetails | null;
}

interface DailyStatusData {
  date: string;
  mind: {
    completed: boolean;
    score: number;
    activities: { id: string; name: string; category: string; completedAt: string }[];
  };
}

// ============ CONSTANTS ============

const MIND_COLOR = '#7C9EE9';

// ============ LOADING SKELETON ============

function MindPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-surface-light rounded-lg" />
          <div className="h-8 w-24 bg-surface-light rounded" />
        </div>
        <div className="w-28 h-10 bg-surface-light rounded-lg" />
      </div>

      {/* Main Score */}
      <div className="flex justify-center py-4">
        <div className="w-[200px] h-[200px] bg-surface-light rounded-full" />
      </div>

      {/* Streak */}
      <div className="flex justify-center">
        <div className="w-32 h-8 bg-surface-light rounded-full" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-24 h-10 bg-surface-light rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Dashboard content */}
      <div className="h-48 bg-surface-light rounded-2xl" />
      <div className="h-32 bg-surface-light rounded-2xl" />
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function MindPage() {
  const router = useRouter();
  const { token } = useAuth();

  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStatus, setDailyStatus] = useState<DailyStatusData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showQuickMeditation, setShowQuickMeditation] = useState(false);
  const [showQuickJournaling, setShowQuickJournaling] = useState(false);
  const [isQuickLogging, setIsQuickLogging] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Derived state
  const isToday = isDateToday(selectedDate);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);

    try {
      const dateStr = formatDateParam(selectedDate);
      const dateParam = isDateToday(selectedDate) ? '' : `?date=${dateStr}`;
      const headers = { Authorization: `Bearer ${token}` };

      const [statusRes, activitiesRes, logsRes] = await Promise.all([
        fetch(`/api/v1/daily-status${dateParam}`, { headers }),
        fetch('/api/v1/activities?pillar=MIND', { headers }),
        fetch(`/api/v1/activity-logs?pillar=MIND&date=${dateStr}`, { headers }),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setDailyStatus(statusData.data);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.data || []);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setActivityLogs(logsData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch mind data:', error);
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

  // Handle quick log
  const handleQuickLog = async (activityId: string) => {
    setIsQuickLogging(activityId);
    try {
      const res = await fetch('/api/v1/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activityId }),
      });

      if (res.ok) {
        setNotification({ type: 'success', message: 'Activity logged!' });
        fetchData();
      } else {
        const error = await res.json();
        setNotification({
          type: 'error',
          message: error.message || 'Failed to log activity',
        });
      }
    } catch (error) {
      console.error('Quick log error:', error);
      setNotification({ type: 'error', message: 'Failed to log activity' });
    } finally {
      setIsQuickLogging(null);
    }
  };

  // Handle uncomplete (toggle off)
  const handleUncomplete = async (activityId: string) => {
    setIsQuickLogging(activityId);
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
      setIsQuickLogging(null);
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
        // Update the selected activity with new data
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

  // Calculate mind score
  const mindScore = dailyStatus?.mind.score ?? 0;

  // Get completed activity IDs for today
  const completedActivityIds = new Set(
    (dailyStatus?.mind.activities ?? []).map((a) => a.id)
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

  // Loading state
  if (isLoading) {
    return <MindPageSkeleton />;
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
          <h1 className="text-2xl font-bold" style={{ color: MIND_COLOR }}>
            Mind
          </h1>
          <p className="text-text-muted text-sm">Mental wellness tracking</p>
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
          pillarColor={MIND_COLOR}
        />
      </motion.section>

      {/* Main Score Ring */}
      <motion.section
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center py-4"
      >
        <ScoreRing score={mindScore} pillar="mind" size={200} strokeWidth={12} />

        {/* Points indicator */}
        <div className="mt-4 text-center">
          <span className="text-text-muted text-sm">
            {mindScore}/100 points{isToday ? ' today' : ''}
          </span>
        </div>
      </motion.section>

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
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        {/* Points Summary */}
        <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Today&apos;s Points</span>
            <span className="text-xl font-bold" style={{ color: MIND_COLOR }}>
              {mindScore} pts
            </span>
          </div>
          <div className="mt-2 text-sm text-text-muted">
            {completedActivityIds.size} of {activities.length} activities completed
          </div>
        </div>

        {/* Activities by Category */}
        {categories.length > 0 ? (
          categories.map((category, idx) => {
            const categoryActivities = groupedActivities[category] || [];
            const config = getSubcategoryConfig(category);
            const categoryColor = config?.color ?? MIND_COLOR;
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
                    const isCurrentlyLogging = isQuickLogging === activity.id;
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
                    const hasDetails =
                      completionLog?.meditationDetails ||
                      completionLog?.journalEntry ||
                      completionLog?.trainingDetails;

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

                        {/* Details section for completed activities */}
                        {isCompleted && hasDetails && (
                          <div className="px-4 pb-3 pt-1 border-t border-white/5 ml-9">
                            {/* Meditation Details */}
                            {completionLog?.meditationDetails && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-text-secondary">
                                    {completionLog.meditationDetails.durationMinutes} min
                                  </span>
                                  {completionLog.meditationDetails.technique && (
                                    <span className="text-text-muted">
                                      {completionLog.meditationDetails.technique.replace(/_/g, ' ').toLowerCase()}
                                    </span>
                                  )}
                                </div>
                                {(completionLog.meditationDetails.moodBefore || completionLog.meditationDetails.moodAfter) && (
                                  <div className="flex items-center gap-2 text-xs text-text-muted">
                                    {completionLog.meditationDetails.moodBefore && (
                                      <span>Before: {completionLog.meditationDetails.moodBefore.toLowerCase()}</span>
                                    )}
                                    {completionLog.meditationDetails.moodBefore && completionLog.meditationDetails.moodAfter && (
                                      <span>→</span>
                                    )}
                                    {completionLog.meditationDetails.moodAfter && (
                                      <span>After: {completionLog.meditationDetails.moodAfter.toLowerCase()}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Journal Entry Details */}
                            {completionLog?.journalEntry && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 text-xs">
                                  <span
                                    className="px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                                  >
                                    {completionLog.journalEntry.entryType.replace(/_/g, ' ').toLowerCase()}
                                  </span>
                                  <span className="text-text-muted">
                                    {completionLog.journalEntry.wordCount} words
                                  </span>
                                  {completionLog.journalEntry.mood && (
                                    <span className="text-text-muted">
                                      Mood: {completionLog.journalEntry.mood.toLowerCase()}
                                    </span>
                                  )}
                                </div>
                                {completionLog.journalEntry.content && (
                                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                                    {completionLog.journalEntry.content}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Training Details (if mind has any) */}
                            {completionLog?.trainingDetails && (
                              <div className="flex items-center gap-3 text-xs">
                                {completionLog.trainingDetails.durationMinutes && (
                                  <span className="text-text-secondary">
                                    {completionLog.trainingDetails.durationMinutes} min
                                  </span>
                                )}
                                {completionLog.trainingDetails.workoutType && (
                                  <span className="text-text-muted">
                                    {completionLog.trainingDetails.workoutType.replace(/_/g, ' ').toLowerCase()}
                                  </span>
                                )}
                                {completionLog.trainingDetails.intensity && (
                                  <span className="text-text-muted">
                                    {completionLog.trainingDetails.intensity.toLowerCase()} intensity
                                  </span>
                                )}
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
              style={{ backgroundColor: `${MIND_COLOR}15` }}
            >
              <svg className="w-8 h-8" fill="none" stroke={MIND_COLOR} viewBox="0 0 24 24">
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
              Create activities to track your mind progress
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
        pillar="MIND"
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

      {/* Quick-Add Modals */}
      <MeditationLogModal
        isOpen={showQuickMeditation}
        onClose={() => setShowQuickMeditation(false)}
        onLogged={() => {
          setShowQuickMeditation(false);
          fetchData();
          setNotification({ type: 'success', message: 'Meditation logged!' });
        }}
        quickAdd
      />

      <JournalingLogModal
        isOpen={showQuickJournaling}
        onClose={() => setShowQuickJournaling(false)}
        onLogged={() => {
          setShowQuickJournaling(false);
          fetchData();
          setNotification({ type: 'success', message: 'Journal entry saved!' });
        }}
        quickAdd
      />

      {/* Floating Action Button */}
      {isToday && (
        <MindFAB
          onMeditationClick={() => setShowQuickMeditation(true)}
          onJournalingClick={() => setShowQuickJournaling(true)}
          onOtherActivityClick={() => setShowActivityModal(true)}
        />
      )}
    </motion.div>
  );
}
