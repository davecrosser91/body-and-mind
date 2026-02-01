'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, GlassCardStatic } from '@/components/ui/GlassCard';
import { MiniScoreRing } from '@/components/scores/ScoreRing';
import { EmberIndicator } from '@/components/scores/EmberBar';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { useAuth } from '@/hooks/useAuth';

interface DailyScoreData {
  date: string;
  bodyScore: number;
  mindScore: number;
  balanceIndex: number;
  bodyComplete: boolean;
  mindComplete: boolean;
}

interface ScoresSummary {
  totalDays: number;
  daysWithData: number;
  averageBody: number;
  averageMind: number;
  averageBalance: number;
  perfectDays: number;
  bodyCompleteDays: number;
  mindCompleteDays: number;
}

interface Achievement {
  id: string;
  type: string;
  unlockedAt: string;
}

// Achievement display config
const ACHIEVEMENT_CONFIG: Record<string, { title: string; description: string; icon: string }> = {
  streak_3: { title: 'Getting Started', description: '3 day streak', icon: 'flame' },
  streak_7: { title: 'One Week Strong', description: '7 day streak', icon: 'fire' },
  streak_14: { title: 'Two Week Champion', description: '14 day streak', icon: 'fire' },
  streak_30: { title: 'Monthly Master', description: '30 day streak', icon: 'trophy' },
  first_workout: { title: 'First Steps', description: 'Complete your first workout', icon: 'dumbbell' },
  perfect_balance: { title: 'Balanced Life', description: 'Body & Mind both 80+', icon: 'balance' },
};

function getDaysForRange(range: 'week' | 'month' | 'all'): number {
  switch (range) {
    case 'week': return 7;
    case 'month': return 30;
    case 'all': return 365;
  }
}

function formatDayLabel(dateStr: string): { day: string; date: string } {
  const date = new Date(dateStr);
  return {
    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    date: String(date.getDate()),
  };
}

function InsightsPageSkeleton() {
  return (
    <div className="animate-pulse space-y-8 pb-8">
      <div>
        <div className="h-8 w-32 bg-surface-light rounded" />
        <div className="h-4 w-48 bg-surface-light rounded mt-2" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-24 bg-surface-light rounded-lg" />
        <div className="h-10 w-28 bg-surface-light rounded-lg" />
        <div className="h-10 w-20 bg-surface-light rounded-lg" />
      </div>
      <div className="h-64 bg-surface-light rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 bg-surface-light rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [scores, setScores] = useState<DailyScoreData[]>([]);
  const [summary, setSummary] = useState<ScoresSummary | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const days = getDaysForRange(timeRange);

      const [scoresRes, achievementsRes, streaksRes] = await Promise.all([
        fetch(`/api/v1/daily-scores?days=${days}`, { headers }),
        fetch('/api/v1/achievements', { headers }).catch(() => null),
        fetch('/api/v1/streaks', { headers }).catch(() => null),
      ]);

      if (scoresRes.ok) {
        const data = await scoresRes.json();
        setScores(data.data.scores || []);
        setSummary(data.data.summary || null);
      }

      if (achievementsRes?.ok) {
        const data = await achievementsRes.json();
        setAchievements(data.data?.achievements || []);
      }

      if (streaksRes?.ok) {
        const data = await streaksRes.json();
        // Find the longest streak across all pillars
        const streaks = data.data || {};
        const longest = Math.max(
          streaks.body?.longest || 0,
          streaks.mind?.longest || 0,
          streaks.overall?.longest || 0
        );
        setLongestStreak(longest);
      }

      // Calculate total completions from scores
      const completions = (scores || []).reduce((sum, s) => {
        return sum + (s.bodyComplete ? 1 : 0) + (s.mindComplete ? 1 : 0);
      }, 0);
      setTotalCompletions(completions);
    } catch (error) {
      console.error('Failed to fetch insights data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, timeRange, scores]);

  useEffect(() => {
    fetchData();
  }, [token, timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get the last 7 days for the weekly chart
  const chartData = timeRange === 'week'
    ? scores.slice(-7)
    : scores.slice(-14); // Show more for month/all

  // Calculate week-over-week comparison for balance trend
  const thisWeekScores = scores.slice(-7);
  const lastWeekScores = scores.slice(-14, -7);

  const thisWeekBalance = thisWeekScores.length > 0
    ? Math.round(thisWeekScores.reduce((sum, s) => sum + s.balanceIndex, 0) / thisWeekScores.length)
    : 0;
  const lastWeekBalance = lastWeekScores.length > 0
    ? Math.round(lastWeekScores.reduce((sum, s) => sum + s.balanceIndex, 0) / lastWeekScores.length)
    : 0;
  const balanceChange = thisWeekBalance - lastWeekBalance;

  if (isLoading) {
    return <InsightsPageSkeleton />;
  }

  const hasData = scores.length > 0;

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
        <h2 className="text-lg font-semibold text-text-primary mb-6">
          {timeRange === 'week' ? 'Weekly' : timeRange === 'month' ? 'Monthly' : 'All Time'} Overview
        </h2>

        {hasData ? (
          <>
            {/* Bar chart */}
            <div className="flex items-end justify-between gap-2 h-40 mb-4">
              {chartData.map((day, i) => {
                const bodyHeight = day.bodyScore ? (day.bodyScore / 100) * 100 : 4;
                const mindHeight = day.mindScore ? (day.mindScore / 100) * 100 : 4;
                const isLast = i === chartData.length - 1;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
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
              {chartData.map((day, i) => {
                const labels = formatDayLabel(day.date);
                const isLast = i === chartData.length - 1;
                return (
                  <div key={day.date} className="flex-1 text-center">
                    <p className={`text-xs ${isLast ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                      {labels.day}
                    </p>
                    <p className={`text-xs ${isLast ? 'text-body' : 'text-text-muted'}`}>
                      {labels.date}
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
          </>
        ) : (
          <div className="h-40 flex items-center justify-center text-text-muted">
            <p>No data available for this period. Start tracking to see your progress!</p>
          </div>
        )}
      </GlassCard>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <GlassCardStatic className="p-4">
          <p className="text-text-muted text-xs mb-1">Avg Body Score</p>
          <div className="flex items-center justify-center mt-2">
            <MiniScoreRing score={summary?.averageBody || 0} pillar="body" size={56} />
          </div>
        </GlassCardStatic>

        <GlassCardStatic className="p-4">
          <p className="text-text-muted text-xs mb-1">Avg Mind Score</p>
          <div className="flex items-center justify-center mt-2">
            <MiniScoreRing score={summary?.averageMind || 0} pillar="mind" size={56} />
          </div>
        </GlassCardStatic>

        <GlassCardStatic className="p-4">
          <p className="text-text-muted text-xs mb-1">Longest Streak</p>
          <EmberIndicator days={longestStreak} className="mt-2" />
        </GlassCardStatic>

        <GlassCardStatic className="p-4">
          <p className="text-text-muted text-xs mb-1">Perfect Days</p>
          <p className="text-2xl font-bold text-text-primary">{summary?.perfectDays || 0}</p>
          <p className="text-xs text-text-muted">Body & Mind complete</p>
        </GlassCardStatic>

        <GlassCardStatic className="p-4">
          <p className="text-text-muted text-xs mb-1">Active Days</p>
          <p className="text-2xl font-bold text-text-primary">{summary?.daysWithData || 0}</p>
          <p className="text-xs text-text-muted">days tracked</p>
        </GlassCardStatic>

        <GlassCardStatic className="p-4">
          <p className="text-text-muted text-xs mb-1">Pillars Completed</p>
          <AnimatedCounter
            value={(summary?.bodyCompleteDays || 0) + (summary?.mindCompleteDays || 0)}
            className="text-2xl font-bold text-text-primary"
          />
        </GlassCardStatic>
      </div>

      {/* Achievements */}
      <GlassCard hover={false} className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Achievements</h2>

        {achievements.length > 0 ? (
          <div className="space-y-3">
            {achievements.map((achievement, i) => {
              const config = ACHIEVEMENT_CONFIG[achievement.type] || {
                title: achievement.type,
                description: 'Achievement unlocked',
                icon: 'star',
              };

              return (
                <motion.div
                  key={achievement.id || achievement.type}
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
                    <p className="font-medium text-text-primary">{config.title}</p>
                    <p className="text-xs text-text-muted">{config.description}</p>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-text-muted">
                    {new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-text-muted py-4">
            No achievements yet. Keep building habits to unlock achievements!
          </p>
        )}

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
            <MiniScoreRing score={thisWeekBalance} pillar="balance" size={60} />
          </div>

          <div className={`flex items-center gap-2 ${balanceChange >= 0 ? 'text-success' : 'text-red-400'}`}>
            {balanceChange !== 0 && (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ transform: balanceChange < 0 ? 'rotate(180deg)' : undefined }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span className="font-medium">{balanceChange > 0 ? '+' : ''}{balanceChange}%</span>
              </>
            )}
            {balanceChange === 0 && <span className="text-text-muted">No change</span>}
          </div>

          <div className="text-center">
            <p className="text-xs text-text-muted mb-2">Last Week</p>
            <MiniScoreRing score={lastWeekBalance} pillar="balance" size={60} />
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-4">
          {balanceChange > 0
            ? 'Your balance is improving! Keep it up.'
            : balanceChange < 0
            ? 'Focus on both pillars to improve your balance.'
            : 'Maintain your balance by staying consistent.'}
        </p>
      </GlassCard>
    </motion.div>
  );
}
