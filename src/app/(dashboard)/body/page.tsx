'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlassCardStatic } from '@/components/ui/GlassCard';
import { ScoreRing } from '@/components/scores/ScoreRing';

// ============ TYPES ============

interface DailyStatusData {
  date: string;
  body: {
    completed: boolean;
    score: number;
    activities: { id: string; name: string; category: string; completedAt: string }[];
  };
  recovery: {
    score: number | null;
    zone: 'green' | 'yellow' | 'red' | null;
    recommendation: string | null;
  } | null;
}

interface WeightsData {
  preset: string;
  body: {
    training: number;
    sleep: number;
    nutrition: number;
  };
}

interface RecoveryData {
  recovery: {
    score: number | null;
    zone: 'green' | 'yellow' | 'red' | null;
    suggestion: string;
    suggestedActivities: string[];
  };
}

// ============ CONSTANTS ============

const BODY_COLOR = '#E8A854';

// ============ HELPER FUNCTIONS ============

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
    TRAINING: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    FITNESS: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    SLEEP: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
    NUTRITION: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  };
  const upperCategory = category.toUpperCase();
  return icons[upperCategory] ?? icons.TRAINING!;
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

function WeightSlider({ label, value, onChange, color = BODY_COLOR }: WeightSliderProps) {
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

export default function BodyPage() {
  const router = useRouter();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStatus, setDailyStatus] = useState<DailyStatusData | null>(null);
  const [weights, setWeights] = useState<WeightsData | null>(null);
  const [recovery, setRecovery] = useState<RecoveryData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Local weight state for slider editing
  const [localWeights, setLocalWeights] = useState({
    training: 35,
    sleep: 35,
    nutrition: 30,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [statusRes, weightsRes, recsRes] = await Promise.all([
        fetch('/api/v1/daily-status'),
        fetch('/api/v1/weights'),
        fetch('/api/v1/recommendations'),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setDailyStatus(statusData.data);
      }

      if (weightsRes.ok) {
        const weightsData = await weightsRes.json();
        setWeights(weightsData.data);
        setLocalWeights(weightsData.data.body);
      }

      if (recsRes.ok) {
        const recsData = await recsRes.json();
        setRecovery(recsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch body data:', error);
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
  const handleWeightChange = (category: 'training' | 'sleep' | 'nutrition', newValue: number) => {
    const currentValue = localWeights[category];
    const diff = newValue - currentValue;

    // Get the other two categories
    const others = (['training', 'sleep', 'nutrition'] as const).filter((c) => c !== category);

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
          body: localWeights,
          mind: weights?.preset === 'CUSTOM' ? undefined : undefined, // Keep existing mind weights
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
      setLocalWeights(weights.body);
      setHasChanges(false);
    }
  };

  // Loading state
  if (isLoading) {
    return <BodyPageSkeleton />;
  }

  const bodyScore = dailyStatus?.body.score ?? 0;
  const activities = dailyStatus?.body.activities ?? [];
  const hasRecovery = dailyStatus?.recovery && dailyStatus.recovery.score !== null;

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
          <h1 className="text-2xl font-bold" style={{ color: BODY_COLOR }}>
            Body
          </h1>
          <p className="text-text-muted text-sm">Physical wellness tracking</p>
        </div>
      </motion.header>

      {/* Main Score Ring */}
      <motion.section
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center py-4"
      >
        <ScoreRing score={bodyScore} pillar="body" size={200} strokeWidth={12} />
      </motion.section>

      {/* Score Breakdown Card */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard hover={false} variant="body" className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Score Breakdown</h2>

          <div className="space-y-4">
            {/* Training */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${BODY_COLOR}20` }}
                >
                  <svg className="w-4 h-4" fill="none" stroke={BODY_COLOR} viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Training</p>
                  <p className="text-xs text-text-muted">Weight: {localWeights.training}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: BODY_COLOR }}>
                  {activities.filter((a) =>
                    ['TRAINING', 'FITNESS'].includes(a.category.toUpperCase())
                  ).length > 0
                    ? 'Done'
                    : '-'}
                </p>
              </div>
            </div>

            {/* Sleep */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${BODY_COLOR}20` }}
                >
                  <svg className="w-4 h-4" fill="none" stroke={BODY_COLOR} viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Sleep</p>
                  <p className="text-xs text-text-muted">Weight: {localWeights.sleep}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: BODY_COLOR }}>
                  {activities.filter((a) => a.category.toUpperCase() === 'SLEEP').length > 0
                    ? 'Done'
                    : '-'}
                </p>
              </div>
            </div>

            {/* Nutrition */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${BODY_COLOR}20` }}
                >
                  <svg className="w-4 h-4" fill="none" stroke={BODY_COLOR} viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Nutrition</p>
                  <p className="text-xs text-text-muted">Weight: {localWeights.nutrition}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: BODY_COLOR }}>
                  {activities.filter((a) => a.category.toUpperCase() === 'NUTRITION').length > 0
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
        <GlassCard hover={false} variant="body" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Weight Configuration</h2>
            <span className="text-xs text-text-muted px-2 py-1 rounded bg-surface-light">
              Must sum to 100%
            </span>
          </div>

          <div className="space-y-5">
            <WeightSlider
              label="Training"
              value={localWeights.training}
              onChange={(v) => handleWeightChange('training', v)}
            />
            <WeightSlider
              label="Sleep"
              value={localWeights.sleep}
              onChange={(v) => handleWeightChange('sleep', v)}
            />
            <WeightSlider
              label="Nutrition"
              value={localWeights.nutrition}
              onChange={(v) => handleWeightChange('nutrition', v)}
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
                  style={{ backgroundColor: BODY_COLOR }}
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

      {/* Recovery Card (if Whoop connected) */}
      {hasRecovery && dailyStatus?.recovery && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard
            hover={false}
            className={`p-6 border ${getRecoveryZoneBg(dailyStatus.recovery.zone)}`}
          >
            <div className="flex items-center justify-between mb-4">
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
                  <h2 className="text-lg font-semibold text-text-primary">Whoop Recovery</h2>
                  <p className="text-sm text-text-muted">Today&apos;s readiness</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-3xl font-bold ${getRecoveryZoneColor(dailyStatus.recovery.zone)}`}
                >
                  {dailyStatus.recovery.score}%
                </span>
                <p
                  className={`text-sm capitalize ${getRecoveryZoneColor(dailyStatus.recovery.zone)}`}
                >
                  {dailyStatus.recovery.zone} zone
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-light">
              <p className="text-sm text-text-secondary">{dailyStatus.recovery.recommendation}</p>
            </div>

            {/* Suggested activities from recovery */}
            {recovery?.recovery.suggestedActivities &&
              recovery.recovery.suggestedActivities.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-text-muted mb-2">Suggested activities:</p>
                  <div className="flex flex-wrap gap-2">
                    {recovery.recovery.suggestedActivities
                      .filter((a) => ['TRAINING', 'SLEEP', 'NUTRITION'].includes(a))
                      .map((activity) => (
                        <span
                          key={activity}
                          className="px-2 py-1 text-xs rounded-full capitalize"
                          style={{
                            backgroundColor: `${BODY_COLOR}20`,
                            color: BODY_COLOR,
                          }}
                        >
                          {activity.toLowerCase()}
                        </span>
                      ))}
                  </div>
                </div>
              )}
          </GlassCard>
        </motion.section>
      )}

      {/* Activity History */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassCard hover={false} variant="body" className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Today&apos;s Activities</h2>

          {activities.length === 0 ? (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${BODY_COLOR}10` }}
              >
                <svg className="w-8 h-8" fill="none" stroke={BODY_COLOR} viewBox="0 0 24 24">
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
                Complete Body habits to see them here
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
                    style={{ backgroundColor: `${BODY_COLOR}20` }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke={BODY_COLOR} viewBox="0 0 24 24">
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
