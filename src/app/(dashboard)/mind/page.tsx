'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlassCardStatic } from '@/components/ui/GlassCard';
import { ScoreRing } from '@/components/scores/ScoreRing';

// ============ TYPES ============

interface DailyStatusData {
  date: string;
  mind: {
    completed: boolean;
    score: number;
    activities: { id: string; name: string; category: string; completedAt: string }[];
  };
  recovery: {
    score: number | null;
    zone: 'green' | 'yellow' | 'red' | null;
    recommendation: string | null;
    hrv?: number | null;
  } | null;
}

interface WeightsData {
  preset: string;
  mind: {
    meditation: number;
    reading: number;
    learning: number;
  };
}

// ============ CONSTANTS ============

const MIND_COLOR = '#5BCCB3';

// ============ HELPER FUNCTIONS ============

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    MEDITATION: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    READING: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    LEARNING: 'M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z',
  };
  const upperCategory = category.toUpperCase();
  return icons[upperCategory] ?? icons.MEDITATION!;
}

// ============ LOADING SKELETON ============

function MindPageSkeleton() {
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
      <div className="h-48 bg-surface-light rounded-2xl" />
      <div className="h-32 bg-surface-light rounded-2xl" />
    </div>
  );
}

// ============ WEIGHT SLIDER COMPONENT ============

interface WeightSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color?: string;
}

function WeightSlider({ label, value, onChange, color = MIND_COLOR }: WeightSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-medium" style={{ color }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, rgba(255,255,255,0.1) ${value}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function MindPage() {
  const router = useRouter();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStatus, setDailyStatus] = useState<DailyStatusData | null>(null);
  const [weights, setWeights] = useState<WeightsData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Local weight state for slider editing
  const [localWeights, setLocalWeights] = useState({
    meditation: 40,
    reading: 30,
    learning: 30,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [statusRes, weightsRes] = await Promise.all([
        fetch('/api/v1/daily-status'),
        fetch('/api/v1/weights'),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setDailyStatus(statusData.data);
      }

      if (weightsRes.ok) {
        const weightsData = await weightsRes.json();
        setWeights(weightsData.data);
        setLocalWeights(weightsData.data.mind);
      }
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

  // Handle weight slider change with auto-balance
  const handleWeightChange = (category: 'meditation' | 'reading' | 'learning', newValue: number) => {
    const currentValue = localWeights[category];
    const diff = newValue - currentValue;

    // Get the other two categories
    const others = (['meditation', 'reading', 'learning'] as const).filter((c) => c !== category);

    // Calculate total of other weights
    const othersTotal = others.reduce((sum, c) => sum + localWeights[c], 0);

    if (othersTotal === 0 && diff > 0) {
      // Can't increase if others are at 0
      return;
    }

    // Distribute the difference proportionally among other categories
    const newWeights = { ...localWeights, [category]: newValue };

    if (othersTotal > 0) {
      const remainingTotal = 100 - newValue;
      others.forEach((other) => {
        const proportion = localWeights[other] / othersTotal;
        newWeights[other] = Math.max(0, Math.round(remainingTotal * proportion));
      });

      // Adjust for rounding errors
      const total = Object.values(newWeights).reduce((sum, v) => sum + v, 0);
      if (total !== 100) {
        const adjustment = 100 - total;
        // Add adjustment to the first other category that can accommodate it
        for (const other of others) {
          if (newWeights[other] + adjustment >= 0) {
            newWeights[other] += adjustment;
            break;
          }
        }
      }
    }

    setLocalWeights(newWeights);
    setHasChanges(true);
  };

  // Save weights
  const handleSaveWeights = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: 'CUSTOM',
          mind: localWeights,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWeights(data.data);
        setHasChanges(false);
        setNotification({
          type: 'success',
          message: 'Weights saved successfully!',
        });
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to save weights.',
        });
      }
    } catch (error) {
      console.error('Failed to save weights:', error);
      setNotification({
        type: 'error',
        message: 'Failed to save weights.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset weights to saved values
  const handleResetWeights = () => {
    if (weights) {
      setLocalWeights(weights.mind);
      setHasChanges(false);
    }
  };

  // Loading state
  if (isLoading) {
    return <MindPageSkeleton />;
  }

  const mindScore = dailyStatus?.mind.score ?? 0;
  const activities = dailyStatus?.mind.activities ?? [];
  const hasHrvData = dailyStatus?.recovery && dailyStatus.recovery.hrv !== null && dailyStatus.recovery.hrv !== undefined;

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

      {/* Main Score Ring */}
      <motion.section
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center py-4"
      >
        <ScoreRing score={mindScore} pillar="mind" size={200} strokeWidth={12} />
      </motion.section>

      {/* Score Breakdown Card */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard hover={false} variant="mind" className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Score Breakdown</h2>

          <div className="space-y-4">
            {/* Meditation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${MIND_COLOR}20` }}
                >
                  <svg className="w-4 h-4" fill="none" stroke={MIND_COLOR} viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Meditation</p>
                  <p className="text-xs text-text-muted">Weight: {localWeights.meditation}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: MIND_COLOR }}>
                  {activities.filter((a) => a.category.toUpperCase() === 'MEDITATION').length > 0
                    ? 'Done'
                    : '-'}
                </p>
              </div>
            </div>

            {/* Reading */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${MIND_COLOR}20` }}
                >
                  <svg className="w-4 h-4" fill="none" stroke={MIND_COLOR} viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Reading</p>
                  <p className="text-xs text-text-muted">Weight: {localWeights.reading}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: MIND_COLOR }}>
                  {activities.filter((a) => a.category.toUpperCase() === 'READING').length > 0
                    ? 'Done'
                    : '-'}
                </p>
              </div>
            </div>

            {/* Learning */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${MIND_COLOR}20` }}
                >
                  <svg className="w-4 h-4" fill="none" stroke={MIND_COLOR} viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Learning</p>
                  <p className="text-xs text-text-muted">Weight: {localWeights.learning}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: MIND_COLOR }}>
                  {activities.filter((a) => a.category.toUpperCase() === 'LEARNING').length > 0
                    ? 'Done'
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.section>

      {/* Weight Configuration Card */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard hover={false} variant="mind" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Weight Configuration</h2>
            <span className="text-xs text-text-muted px-2 py-1 rounded bg-surface-light">
              Must sum to 100%
            </span>
          </div>

          <div className="space-y-5">
            <WeightSlider
              label="Meditation"
              value={localWeights.meditation}
              onChange={(v) => handleWeightChange('meditation', v)}
            />
            <WeightSlider
              label="Reading"
              value={localWeights.reading}
              onChange={(v) => handleWeightChange('reading', v)}
            />
            <WeightSlider
              label="Learning"
              value={localWeights.learning}
              onChange={(v) => handleWeightChange('learning', v)}
            />
          </div>

          {/* Save/Reset buttons */}
          <AnimatePresence>
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-3 mt-6"
              >
                <button
                  onClick={handleResetWeights}
                  className="flex-1 px-4 py-2 text-sm font-medium text-text-muted bg-surface-light rounded-lg hover:bg-surface-lighter transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleSaveWeights}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 text-sm font-medium text-background rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: MIND_COLOR }}
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
                      Saving
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.section>

      {/* HRV Insights Card (if Whoop connected) */}
      {hasHrvData && dailyStatus?.recovery && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard hover={false} variant="mind" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${MIND_COLOR}20` }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke={MIND_COLOR}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">HRV Insights</h2>
                  <p className="text-sm text-text-muted">Heart Rate Variability</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className="text-3xl font-bold"
                  style={{ color: MIND_COLOR }}
                >
                  {dailyStatus.recovery.hrv}
                </span>
                <p className="text-sm text-text-muted">ms</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-light">
              <p className="text-sm text-text-secondary">
                {dailyStatus.recovery.hrv && dailyStatus.recovery.hrv >= 60
                  ? 'Your HRV indicates good recovery. A calm mind supports mental performance today.'
                  : dailyStatus.recovery.hrv && dailyStatus.recovery.hrv >= 40
                  ? 'Moderate HRV levels. Consider light mindfulness activities to support mental clarity.'
                  : 'Lower HRV detected. Prioritize stress-reducing activities like meditation or gentle reading.'}
              </p>
            </div>

            {/* Stress/Recovery Correlation */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-surface-light">
                <p className="text-xs text-text-muted mb-1">Stress Level</p>
                <p className="text-sm font-medium text-text-primary">
                  {dailyStatus.recovery.hrv && dailyStatus.recovery.hrv >= 60
                    ? 'Low'
                    : dailyStatus.recovery.hrv && dailyStatus.recovery.hrv >= 40
                    ? 'Moderate'
                    : 'Elevated'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-light">
                <p className="text-xs text-text-muted mb-1">Mental Readiness</p>
                <p className="text-sm font-medium text-text-primary">
                  {dailyStatus.recovery.hrv && dailyStatus.recovery.hrv >= 60
                    ? 'Optimal'
                    : dailyStatus.recovery.hrv && dailyStatus.recovery.hrv >= 40
                    ? 'Good'
                    : 'Rest Recommended'}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.section>
      )}

      {/* Activity History */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassCard hover={false} variant="mind" className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Today&apos;s Activities</h2>

          {activities.length === 0 ? (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${MIND_COLOR}10` }}
              >
                <svg className="w-8 h-8" fill="none" stroke={MIND_COLOR} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <p className="text-text-muted text-sm">No activities logged yet</p>
              <p className="text-text-muted text-xs mt-1">
                Complete Mind habits to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-light"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${MIND_COLOR}20` }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke={MIND_COLOR} viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={getCategoryIcon(activity.category)}
                      />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{activity.name}</p>
                    <p className="text-xs text-text-muted capitalize">
                      {activity.category.toLowerCase()}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-text-muted">{formatTime(activity.completedAt)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.section>

      {/* Preset Selector (subtle) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <GlassCardStatic className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Current Preset</p>
              <p className="text-xs text-text-muted capitalize">
                {weights?.preset.toLowerCase() || 'balanced'}
              </p>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Change preset
            </button>
          </div>
        </GlassCardStatic>
      </motion.section>
    </motion.div>
  );
}
