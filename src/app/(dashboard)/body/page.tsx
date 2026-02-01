'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ScoreRing } from '@/components/scores/ScoreRing';
import {
  SubCategoryTabs,
  TrainingDashboard,
  SleepDashboard,
  NutritionDashboard,
  CustomDashboard,
} from '@/components/subcategories';
import { QuickLogChips } from '@/components/activities';
import { ActivityLogModal } from '@/components/activities/ActivityLogModal';
import { PREDEFINED_SUBCATEGORIES, getSubcategoryConfig } from '@/lib/subcategories';
import { POINTS_THRESHOLD } from '@/lib/points';

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

      {/* Tabs */}
      <div className="flex gap-2">
        <div className="w-24 h-10 bg-surface-light rounded-full" />
        <div className="w-20 h-10 bg-surface-light rounded-full" />
        <div className="w-24 h-10 bg-surface-light rounded-full" />
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

  // State
  const [selectedCategory, setSelectedCategory] = useState('TRAINING');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [dailyStatus, setDailyStatus] = useState<DailyStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [loggingActivityId, setLoggingActivityId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Calculate points from daily status activities
  const bodyPoints = dailyStatus?.body.score ?? 0;

  // Calculate category points from completed activities
  const categoryCompletions = dailyStatus?.body.activities.filter(
    (a) => a.category.toUpperCase() === selectedCategory.toUpperCase()
  ) ?? [];
  const categoryPoints = categoryCompletions.length * 25; // Approximate points per activity

  // Get streak
  const streak = dailyStatus?.streak.current ?? 0;

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [activitiesRes, statusRes] = await Promise.all([
        fetch('/api/v1/activities?pillar=BODY'),
        fetch('/api/v1/daily-status'),
      ]);

      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data.data);
        // Extract custom categories
        const allSubCategories = data.data.map((a: Activity) => a.subCategory) as string[];
        const customSubCategories = allSubCategories.filter(
          (sc: string) => !PREDEFINED_SUBCATEGORIES.BODY.includes(sc as typeof PREDEFINED_SUBCATEGORIES.BODY[number])
        );
        const custom = Array.from(new Set(customSubCategories));
        setCustomCategories(custom);
      }

      if (statusRes.ok) {
        const data = await statusRes.json();
        setDailyStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Activity logged!' });
        fetchData(); // Refresh data
      } else {
        setNotification({ type: 'error', message: 'Failed to log activity' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to log activity' });
    } finally {
      setLoggingActivityId(null);
    }
  };

  // Handle add custom category
  const handleAddCustomCategory = () => {
    // For now, show an alert - this would open a modal in full implementation
    // The AddSubCategoryModal component needs to be created
    setNotification({
      type: 'error',
      message: 'Custom categories coming soon!',
    });
  };

  // Render dashboard based on selected category
  const renderDashboard = () => {
    const categoryActivities =
      dailyStatus?.body.activities
        .filter((c) => c.category.toUpperCase() === selectedCategory.toUpperCase())
        .map((c) => ({
          id: c.id,
          name: c.name,
          completedAt: c.completedAt,
          pointsEarned: 25, // Default points
        })) ?? [];

    switch (selectedCategory) {
      case 'TRAINING':
        return (
          <TrainingDashboard
            whoopData={dailyStatus?.whoop?.training}
            activities={categoryActivities}
            totalPoints={categoryPoints}
          />
        );
      case 'SLEEP':
        return (
          <SleepDashboard
            whoopData={dailyStatus?.whoop?.sleep}
            activities={categoryActivities}
            totalPoints={categoryPoints}
          />
        );
      case 'NUTRITION':
        return (
          <NutritionDashboard activities={categoryActivities} totalPoints={categoryPoints} />
        );
      default:
        return (
          <CustomDashboard
            categoryName={selectedCategory}
            activities={categoryActivities}
            totalPoints={categoryPoints}
            pillar="BODY"
          />
        );
    }
  };

  // Get habits for quick log (isHabit=true for current category)
  const quickLogHabits = activities
    .filter((a) => a.isHabit && a.subCategory.toUpperCase() === selectedCategory.toUpperCase())
    .map((a) => ({
      id: a.id,
      name: a.name,
      points: a.points,
      subCategory: a.subCategory,
    }));

  // Loading state
  if (isLoading) {
    return <BodyPageSkeleton />;
  }

  // Get subcategory config for selected category color
  const categoryConfig = getSubcategoryConfig(selectedCategory);
  const categoryColor = categoryConfig?.color ?? BODY_COLOR;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8 max-w-2xl mx-auto"
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
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
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
        </div>
        <button
          onClick={() => setShowActivityModal(true)}
          className="px-4 py-2 rounded-lg font-medium text-background transition-colors hover:opacity-90"
          style={{ backgroundColor: BODY_COLOR }}
        >
          Log Activity
        </button>
      </motion.header>

      {/* Score Ring and Streak */}
      <motion.section
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center py-4"
      >
        <div className="relative">
          <ScoreRing score={bodyPoints} pillar="body" size={200} strokeWidth={12} showLabel={false} />
          {/* Points display in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: BODY_COLOR }}>
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
            transition={{ delay: 0.2 }}
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

      {/* SubCategory Tabs */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SubCategoryTabs
          pillar="BODY"
          selectedCategory={selectedCategory}
          customCategories={customCategories}
          onSelect={setSelectedCategory}
          onAddCustom={handleAddCustomCategory}
        />
      </motion.section>

      {/* Quick Log Chips */}
      {quickLogHabits.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <QuickLogChips
            activities={quickLogHabits}
            onLog={handleQuickLog}
            isLogging={loggingActivityId}
            pillarColor={categoryColor}
          />
        </motion.section>
      )}

      {/* Dashboard Content */}
      <motion.section
        key={selectedCategory}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderDashboard()}
          </motion.div>
        </AnimatePresence>
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
    </motion.div>
  );
}
