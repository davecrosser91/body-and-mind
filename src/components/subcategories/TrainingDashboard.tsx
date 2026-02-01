'use client';

import { motion } from 'framer-motion';
import { TrainingCard } from '@/components/whoop';

interface Activity {
  id: string;
  name: string;
  completedAt: string;
  pointsEarned: number;
}

interface TrainingData {
  strain: number;
  calories: number;
  workouts: {
    name: string;
    strain: number;
    duration: number;
    calories: number;
  }[];
}

interface TrainingDashboardProps {
  activities: Activity[];
  totalPoints: number;
  whoopData?: TrainingData | null;
}

export function TrainingDashboard({ activities, totalPoints, whoopData }: TrainingDashboardProps) {
  const color = '#EF4444';

  return (
    <div className="space-y-4">
      {/* Whoop Training Card */}
      {whoopData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TrainingCard data={whoopData} />
        </motion.div>
      )}

      {/* Points Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5"
      >
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Training Points</span>
          <span className="text-xl font-bold" style={{ color }}>{totalPoints} pts</span>
        </div>
      </motion.div>

      {/* Today's Activities */}
      {activities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5"
        >
          <h3 className="text-sm font-medium text-text-muted mb-3">Today&apos;s Training</h3>
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
      {activities.length === 0 && !whoopData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <p className="text-text-muted">No training logged yet</p>
        </motion.div>
      )}
    </div>
  );
}
