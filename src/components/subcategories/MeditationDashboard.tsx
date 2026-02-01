'use client';

import { motion } from 'framer-motion';

interface Activity {
  id: string;
  name: string;
  completedAt: string;
  pointsEarned: number;
}

interface MeditationDashboardProps {
  activities: Activity[];
  totalPoints: number;
  streak?: number;
}

export function MeditationDashboard({ activities, totalPoints, streak = 0 }: MeditationDashboardProps) {
  const color = '#8B5CF6';

  return (
    <div className="space-y-4">
      {/* Streak Card */}
      {streak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color }}>{streak}</p>
              <p className="text-sm text-text-muted">Day Streak</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Points Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: streak > 0 ? 0.1 : 0 }}
        className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5"
      >
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Meditation Points</span>
          <span className="text-xl font-bold" style={{ color }}>{totalPoints} pts</span>
        </div>
      </motion.div>

      {/* Today's Activities */}
      {activities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: streak > 0 ? 0.2 : 0.1 }}
          className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5"
        >
          <h3 className="text-sm font-medium text-text-muted mb-3">Today&apos;s Meditation</h3>
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <span className="text-text-primary">{activity.name}</span>
                <span className="text-sm" style={{ color }}>+{activity.pointsEarned}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {activities.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: streak > 0 ? 0.2 : 0.1 }}
          className="text-center py-8"
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <svg className="w-8 h-8" fill="none" stroke={color} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-text-muted">No meditation logged yet</p>
        </motion.div>
      )}
    </div>
  );
}
