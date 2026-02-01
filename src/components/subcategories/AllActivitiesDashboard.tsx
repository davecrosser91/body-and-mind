'use client';

import { motion } from 'framer-motion';
import { getSubcategoryConfig } from '@/lib/subcategories';

interface Activity {
  id: string;
  name: string;
  pillar?: string;
  subCategory: string;
  completedAt?: string;
  pointsEarned?: number;
  points?: number;
  isHabit?: boolean;
}

interface AllActivitiesDashboardProps {
  activities: Activity[];
  completedActivities: { id: string; name: string; category: string; completedAt: string }[];
  totalPoints: number;
  pillar: 'BODY' | 'MIND';
  onQuickLog?: (activityId: string) => void;
  onActivitySelect?: (activity: Activity) => void;
  isLogging?: string | null;
}

export function AllActivitiesDashboard({
  activities,
  completedActivities,
  totalPoints,
  pillar,
  onQuickLog,
  onActivitySelect,
  isLogging,
}: AllActivitiesDashboardProps) {
  const pillarColor = pillar === 'BODY' ? '#E8A854' : '#5BCCB3';

  // Group activities by subcategory
  const groupedActivities = activities.reduce<Record<string, Activity[]>>((acc, activity) => {
    const cat = activity.subCategory.toUpperCase();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(activity);
    return acc;
  }, {});

  // Get completed activity IDs
  const completedIds = new Set(completedActivities.map((a) => a.id));

  // Get all categories that have activities
  const categories = Object.keys(groupedActivities).sort();

  return (
    <div className="space-y-4">
      {/* Points Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5"
      >
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Today&apos;s Points</span>
          <span className="text-xl font-bold" style={{ color: pillarColor }}>
            {totalPoints} pts
          </span>
        </div>
        <div className="mt-2 text-sm text-text-muted">
          {completedActivities.length} of {activities.length} activities completed
        </div>
      </motion.div>

      {/* Activities by Category */}
      {categories.length > 0 ? (
        categories.map((category, idx) => {
          const categoryActivities = groupedActivities[category] || [];
          const config = getSubcategoryConfig(category);
          const categoryColor = config?.color ?? pillarColor;
          const categoryLabel = config?.label ?? category;

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
                  {categoryActivities.filter((a) => completedIds.has(a.id)).length}/{categoryActivities.length}
                </span>
              </div>

              <div className="space-y-2">
                {categoryActivities.map((activity) => {
                  const isCompleted = completedIds.has(activity.id);
                  const isCurrentlyLogging = isLogging === activity.id;

                  return (
                    <div
                      key={activity.id}
                      className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                        isCompleted
                          ? 'bg-white/5'
                          : 'bg-surface-light hover:bg-surface-lighter'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Completion indicator */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                            isCompleted ? '' : 'border-2'
                          }`}
                          style={{
                            backgroundColor: isCompleted ? categoryColor : 'transparent',
                            borderColor: isCompleted ? categoryColor : 'rgba(255,255,255,0.2)',
                          }}
                        >
                          {isCompleted && (
                            <svg className="w-3 h-3 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        <div>
                          <span
                            className={`text-sm ${
                              isCompleted ? 'text-text-muted line-through' : 'text-text-primary'
                            }`}
                          >
                            {activity.name}
                          </span>
                          {activity.isHabit && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-white/5 text-text-muted">
                              Habit
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">
                          {activity.pointsEarned ?? activity.points ?? 25} pts
                        </span>

                        {/* Quick log button for non-completed activities */}
                        {!isCompleted && onQuickLog && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickLog(activity.id);
                            }}
                            disabled={isCurrentlyLogging}
                            className="px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            style={{
                              backgroundColor: `${categoryColor}20`,
                              color: categoryColor,
                            }}
                          >
                            {isCurrentlyLogging ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                            ) : (
                              'Log'
                            )}
                          </button>
                        )}

                        {/* Edit button */}
                        {onActivitySelect && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onActivitySelect(activity);
                            }}
                            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-lighter transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
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
            style={{ backgroundColor: `${pillarColor}15` }}
          >
            <svg className="w-8 h-8" fill="none" stroke={pillarColor} viewBox="0 0 24 24">
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
            Create activities to track your {pillar.toLowerCase()} progress
          </p>
        </motion.div>
      )}

      {/* Completed Today Section */}
      {completedActivities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5"
        >
          <h3 className="text-sm font-medium text-text-muted mb-3">Completed Today</h3>
          <div className="space-y-2">
            {completedActivities.map((activity) => {
              const config = getSubcategoryConfig(activity.category);
              const categoryColor = config?.color ?? pillarColor;
              const time = new Date(activity.completedAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              });

              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <span className="text-text-primary text-sm">{activity.name}</span>
                  </div>
                  <span className="text-xs text-text-muted">{time}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
