'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface Activity {
  id: string;
  name: string;
  completedAt: string;
  pointsEarned: number;
}

interface JournalingDashboardProps {
  activities: Activity[];
  totalPoints: number;
  onStartJournaling?: () => void;
  isToday?: boolean;
}

export function JournalingDashboard({
  activities,
  totalPoints,
  onStartJournaling,
  isToday = true,
}: JournalingDashboardProps) {
  const color = '#EC4899';

  return (
    <div className="space-y-4">
      {/* Quick Start Card */}
      {isToday && onStartJournaling && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onStartJournaling}
          className="w-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 backdrop-blur-lg rounded-2xl p-4 border border-pink-500/30 text-left hover:border-pink-500/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${color}30` }}
            >
              <span className="text-2xl">📝</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary">Start Writing</p>
              <p className="text-sm text-text-muted">Gratitude, reflection, or free-write</p>
            </div>
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </motion.button>
      )}

      {/* Points Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5"
      >
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Journaling Points</span>
          <span className="text-xl font-bold" style={{ color }}>{totalPoints} pts</span>
        </div>
      </motion.div>

      {/* Journal History Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Link
          href="/mind/journal"
          className="block bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5 hover:border-pink-500/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-text-secondary">View Journal History</span>
            </div>
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </motion.div>

      {/* Today's Activities */}
      {activities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
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

      {/* Empty State - only show when not today (no quick-start available) */}
      {activities.length === 0 && !isToday && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
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
