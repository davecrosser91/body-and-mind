'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ScoreRing } from '@/components/scores/ScoreRing';
import { ActivityLogModal } from '@/components/activities/ActivityLogModal';
import { SubCategoryTabs } from '@/components/subcategories/SubCategoryTabs';
import { MeditationDashboard } from '@/components/subcategories/MeditationDashboard';
import { ReadingDashboard } from '@/components/subcategories/ReadingDashboard';
import { LearningDashboard } from '@/components/subcategories/LearningDashboard';
import { JournalingDashboard } from '@/components/subcategories/JournalingDashboard';
import { CustomDashboard } from '@/components/subcategories/CustomDashboard';
import { QuickLogChips } from '@/components/activities/QuickLogChips';
import { PREDEFINED_SUBCATEGORIES } from '@/lib/subcategories';

// ============ TYPES ============

interface Activity {
  id: string;
  name: string;
  pillar: string;
  subCategory: string;
  points: number;
  isHabit: boolean;
}

interface ActivityLog {
  id: string;
  activityId: string;
  activityName: string;
  subCategory: string;
  pointsEarned: number;
  completedAt: string;
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

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStatus, setDailyStatus] = useState<DailyStatusData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('MEDITATION');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [isQuickLogging, setIsQuickLogging] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Calculate points per subcategory
  const pointsByCategory = activityLogs.reduce<Record<string, number>>((acc, log) => {
    const cat = log.subCategory.toUpperCase();
    acc[cat] = (acc[cat] || 0) + log.pointsEarned;
    return acc;
  }, {});

  // Get activities for the current subcategory that are habits
  const habitActivities = activities.filter(
    (a) =>
      a.isHabit &&
      a.subCategory.toUpperCase() === selectedCategory.toUpperCase()
  );

  // Get activity logs for the current subcategory
  const currentCategoryLogs = activityLogs.filter(
    (log) => log.subCategory.toUpperCase() === selectedCategory.toUpperCase()
  );

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [statusRes, activitiesRes, logsRes] = await Promise.all([
        fetch('/api/v1/daily-status'),
        fetch('/api/v1/activities?pillar=MIND'),
        fetch(`/api/v1/activity-logs?pillar=MIND&date=${today}`),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setDailyStatus(statusData.data);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.data || []);

        // Extract custom categories (not predefined)
        const allCategories = (activitiesData.data || []).map((a: Activity) =>
          a.subCategory.toUpperCase()
        );
        const predefined = PREDEFINED_SUBCATEGORIES.MIND.map((c) => c.toUpperCase());
        const custom = Array.from(new Set(allCategories.filter((c: string) => !predefined.includes(c)))) as string[];
        setCustomCategories(custom);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setActivityLogs(logsData.data || []);
      }

      // TODO: Fetch streak data when API is available
      setStreak(0);
    } catch (error) {
      console.error('Failed to fetch mind data:', error);
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

  // Handle quick log
  const handleQuickLog = async (activityId: string) => {
    setIsQuickLogging(activityId);
    try {
      const res = await fetch('/api/v1/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Handle add custom category
  const handleAddCustomCategory = () => {
    // For now, show the activity modal - custom category creation happens there
    setShowActivityModal(true);
  };


  // Render the appropriate dashboard based on selected category
  const renderDashboard = () => {
    const categoryActivities = currentCategoryLogs.map((log) => ({
      id: log.id,
      name: log.activityName,
      completedAt: log.completedAt,
      pointsEarned: log.pointsEarned,
    }));
    const totalPoints = pointsByCategory[selectedCategory.toUpperCase()] || 0;

    switch (selectedCategory.toUpperCase()) {
      case 'MEDITATION':
        return (
          <MeditationDashboard
            activities={categoryActivities}
            totalPoints={totalPoints}
            streak={streak}
          />
        );
      case 'READING':
        return (
          <ReadingDashboard
            activities={categoryActivities}
            totalPoints={totalPoints}
          />
        );
      case 'LEARNING':
        return (
          <LearningDashboard
            activities={categoryActivities}
            totalPoints={totalPoints}
          />
        );
      case 'JOURNALING':
        return (
          <JournalingDashboard
            activities={categoryActivities}
            totalPoints={totalPoints}
          />
        );
      default:
        // Custom category
        return (
          <CustomDashboard
            activities={categoryActivities}
            totalPoints={totalPoints}
            categoryName={selectedCategory}
            pillar="MIND"
          />
        );
    }
  };

  // Loading state
  if (isLoading) {
    return <MindPageSkeleton />;
  }

  const mindScore = dailyStatus?.mind.score ?? 0;

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
            <h1 className="text-2xl font-bold" style={{ color: MIND_COLOR }}>
              Mind
            </h1>
            <p className="text-text-muted text-sm">Mental wellness tracking</p>
          </div>
        </div>
        <button
          onClick={() => setShowActivityModal(true)}
          className="px-4 py-2 rounded-lg font-medium text-background transition-colors hover:opacity-90"
          style={{ backgroundColor: MIND_COLOR }}
        >
          Log Activity
        </button>
      </motion.header>

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
            {mindScore}/100 points today
          </span>
        </div>
      </motion.section>

      {/* Streak Display */}
      {streak > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex justify-center"
        >
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ backgroundColor: `${MIND_COLOR}20` }}
          >
            <svg className="w-5 h-5" fill="none" stroke={MIND_COLOR} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
            </svg>
            <span className="font-medium" style={{ color: MIND_COLOR }}>
              {streak} day streak
            </span>
          </div>
        </motion.section>
      )}

      {/* SubCategory Tabs */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SubCategoryTabs
          pillar="MIND"
          selectedCategory={selectedCategory}
          customCategories={customCategories}
          onSelect={setSelectedCategory}
          onAddCustom={handleAddCustomCategory}
        />
      </motion.section>

      {/* Quick Log Chips */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <QuickLogChips
          activities={habitActivities.map((a) => ({
            id: a.id,
            name: a.name,
            points: a.points,
            subCategory: a.subCategory,
          }))}
          onLog={handleQuickLog}
          isLogging={isQuickLogging}
          pillarColor={MIND_COLOR}
        />
      </motion.section>

      {/* Dashboard Content */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        key={selectedCategory}
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
        pillar="MIND"
        customCategories={customCategories}
      />
    </motion.div>
  );
}
