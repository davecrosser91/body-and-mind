'use client';

import { motion } from 'framer-motion';

interface Activity {
  id: string;
  name: string;
  points: number;
  subCategory: string;
}

interface QuickLogChipsProps {
  activities: Activity[]; // isHabit = true activities
  onLog: (activityId: string) => void;
  isLogging: string | null; // ID of activity being logged
  pillarColor?: string;
}

export function QuickLogChips({ activities, onLog, isLogging, pillarColor = '#E8A854' }: QuickLogChipsProps) {
  if (activities.length === 0) return null;

  return (
    <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5">
      <h3 className="text-sm font-medium text-text-muted mb-3">Quick Log</h3>
      <div className="flex flex-wrap gap-2">
        {activities.map((activity) => (
          <motion.button
            key={activity.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onLog(activity.id)}
            disabled={isLogging === activity.id}
            className="px-3 py-1.5 rounded-full text-sm bg-surface-light text-text-secondary hover:text-text-primary hover:bg-surface-lighter transition-colors disabled:opacity-50"
          >
            {isLogging === activity.id ? (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Logging...
              </span>
            ) : (
              <>
                {activity.name}
                <span className="text-text-muted ml-1" style={{ color: pillarColor }}>+{activity.points}</span>
              </>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
