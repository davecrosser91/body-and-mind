'use client';

import { motion } from 'framer-motion';

interface Activity {
  id: string;
  name: string;
  completedAt: string;
  pointsEarned: number;
}

interface CustomDashboardProps {
  activities: Activity[];
  totalPoints: number;
  categoryName: string;
  pillar: 'BODY' | 'MIND';
}

export function CustomDashboard({ activities, totalPoints, categoryName, pillar }: CustomDashboardProps) {
  const color = pillar === 'BODY' ? '#E8A854' : '#7C9EE9';

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
          <span className="text-text-secondary">{categoryName} Points</span>
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
          <h3 className="text-sm font-medium text-text-muted mb-3">Today&apos;s {categoryName}</h3>
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
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <p className="text-text-muted">No {categoryName.toLowerCase()} logged yet</p>
        </motion.div>
      )}
    </div>
  );
}
