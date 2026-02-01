'use client';

import { motion } from 'framer-motion';

interface Activity {
  id: string;
  name: string;
  completedAt: string;
  pointsEarned: number;
}

interface JournalingDashboardProps {
  activities: Activity[];
  totalPoints: number;
}

export function JournalingDashboard({ activities, totalPoints }: JournalingDashboardProps) {
  const color = '#EC4899';

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
          <span className="text-text-secondary">Journaling Points</span>
          <span className="text-xl font-bold" style={{ color }}>{totalPoints} pts</span>
        </div>
      </motion.div>

      {/* Today's Activities */}
      {activities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5"
        >
          <h3 className="text-sm font-medium text-text-muted mb-3">Today&apos;s Journaling</h3>
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
          transition={{ duration: 0.3, delay: 0.1 }}
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <p className="text-text-muted">No journaling logged yet</p>
        </motion.div>
      )}
    </div>
  );
}
