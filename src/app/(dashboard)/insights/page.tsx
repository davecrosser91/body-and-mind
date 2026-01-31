'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, GlassCardStatic } from '@/components/ui/GlassCard';
import { MiniScoreRing } from '@/components/scores/ScoreRing';
import { EmberIndicator } from '@/components/scores/EmberBar';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

// Demo data for the week
const WEEKLY_DATA = [
  { day: 'Mon', bodyScore: 65, mindScore: 70, date: '27' },
  { day: 'Tue', bodyScore: 72, mindScore: 68, date: '28' },
  { day: 'Wed', bodyScore: 80, mindScore: 75, date: '29' },
  { day: 'Thu', bodyScore: 75, mindScore: 82, date: '30' },
  { day: 'Fri', bodyScore: 68, mindScore: 88, date: '31' },
  { day: 'Sat', bodyScore: 0, mindScore: 0, date: '1' },
  { day: 'Sun', bodyScore: 0, mindScore: 0, date: '2' },
];

const ACHIEVEMENTS = [
  { type: 'streak_7', title: 'One Week Strong', description: '7 day streak', unlockedAt: '2025-01-25', icon: 'fire' },
  { type: 'streak_3', title: 'Getting Started', description: '3 day streak', unlockedAt: '2025-01-22', icon: 'flame' },
  { type: 'first_workout', title: 'First Steps', description: 'Complete your first workout', unlockedAt: '2025-01-20', icon: 'dumbbell' },
];

const STATS = {
  totalDays: 12,
  perfectDays: 4,
  avgBodyScore: 72,
  avgMindScore: 77,
  longestStreak: 12,
  totalHabitsCompleted: 156,
};

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-8"
    >
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Insights</h1>
        <p className="text-text-muted mt-1">Track your progress over time</p>
      </header>

      {/* Time range selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${timeRange === range
                ? 'bg-surface-lighter text-text-primary'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-light'
              }
            `}
          >
            {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Weekly chart */}
      <GlassCard hover={false} className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-6">Weekly Overview</h2>

        {/* Bar chart */}
        <div className="flex items-end justify-between gap-2 h-40 mb-4">
          {WEEKLY_DATA.map((day, i) => {
            const bodyHeight = day.bodyScore ? (day.bodyScore / 100) * 100 : 4;
            const mindHeight = day.mindScore ? (day.mindScore / 100) * 100 : 4;
            const isToday = i === 4; // Friday

            return (
              <div key={day.day} className="flex-1 flex flex-col items-center">
                <div className="flex gap-1 h-full items-end">
                  {/* Body bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${bodyHeight}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className={`w-3 rounded-t ${day.bodyScore ? 'bg-body' : 'bg-surface-lighter'}`}
                  />
                  {/* Mind bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${mindHeight}%` }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.4 }}
                    className={`w-3 rounded-t ${day.mindScore ? 'bg-mind' : 'bg-surface-lighter'}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Day labels */}
        <div className="flex justify-between">
          {WEEKLY_DATA.map((day, i) => {
            const isToday = i === 4;
            return (
              <div key={day.day} className="flex-1 text-center">
                <p className={`text-xs ${isToday ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                  {day.day}
                </p>
                <p className={`text-xs ${isToday ? 'text-body' : 'text-text-muted'}`}>
                  {day.date}
                </p>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-body" />
            <span className="text-xs text-text-muted">Body</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-mind" />
            <span className="text-xs text-text-muted">Mind</span>
          </div>
        </div>
      </GlassCard>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <GlassCardStatic className="p-4">
          <p className="text-text-muted text-xs mb-1">Avg Body Score</p>
          <div className="flex items-center gap-3">
            <MiniScoreRing score={STATS.avgBodyScore} pillar="body" size={40} />
            <AnimatedCounter value={STATS.avgBodyScore} className="text-2xl font-bold text-body" />
          </div>
        </GlassCardStatic>

        <GlassCardStatic className="p-4">
          <p className="text-text-muted text-xs mb-1">Avg Mind Score</p>
          <div className="flex items-center gap-3">
            <MiniScoreRing score={STATS.avgMindScore} pillar="mind" size={40} />
            <AnimatedCounter value={STATS.avgMindScore} className="text-2xl font-bold text-mind" />
          </div>
        </GlassCardStatic>

        <GlassCardStatic className="p-4">
          <p className="text-text-muted text-xs mb-1">Longest Streak</p>
          <EmberIndicator days={STATS.longestStreak} className="mt-2" />
        </GlassCardStatic>

        <GlassCardStatic className="p-4">
          <p className="text-text-muted text-xs mb-1">Perfect Days</p>
          <p className="text-2xl font-bold text-text-primary">{STATS.perfectDays}</p>
          <p className="text-xs text-text-muted">Body & Mind both 80+</p>
        </GlassCardStatic>

        <GlassCardStatic className="p-4">
          <p className="text-text-muted text-xs mb-1">Active Days</p>
          <p className="text-2xl font-bold text-text-primary">{STATS.totalDays}</p>
          <p className="text-xs text-text-muted">days tracked</p>
        </GlassCardStatic>

        <GlassCardStatic className="p-4">
          <p className="text-text-muted text-xs mb-1">Habits Completed</p>
          <AnimatedCounter value={STATS.totalHabitsCompleted} className="text-2xl font-bold text-text-primary" />
        </GlassCardStatic>
      </div>

      {/* Achievements */}
      <GlassCard hover={false} className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Achievements</h2>

        <div className="space-y-3">
          {ACHIEVEMENTS.map((achievement, i) => (
            <motion.div
              key={achievement.type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-surface-light"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-body/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-body" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.93 2.5-6.63 5-9.5.87-1 1.5-2.5 1.5-4 0 0 1.31 1.88 1.72 3.5C11.5 6.5 12 7.5 13 8c1.5-2 2.5-4 2.5-6 0 0 2.53 2.95 4 7 .73 2.02 1 3.5 1 5 0 4.42-4.03 8-8.5 9z" />
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="font-medium text-text-primary">{achievement.title}</p>
                <p className="text-xs text-text-muted">{achievement.description}</p>
              </div>

              {/* Date */}
              <p className="text-xs text-text-muted">
                {new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </motion.div>
          ))}
        </div>

        {/* More achievements hint */}
        <p className="text-center text-sm text-text-muted mt-4">
          Keep building habits to unlock more achievements
        </p>
      </GlassCard>

      {/* Balance trend */}
      <GlassCard hover={false} className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Balance Trend</h2>

        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-xs text-text-muted mb-2">This Week</p>
            <MiniScoreRing score={75} pillar="balance" size={60} />
          </div>

          <div className="flex items-center gap-2 text-success">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="font-medium">+5%</span>
          </div>

          <div className="text-center">
            <p className="text-xs text-text-muted mb-2">Last Week</p>
            <MiniScoreRing score={70} pillar="balance" size={60} />
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-4">
          Your balance is improving! Keep it up.
        </p>
      </GlassCard>
    </motion.div>
  );
}
