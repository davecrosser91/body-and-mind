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
  _isCurrentMonth?: boolean; // For calendar view
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

/**
 * Get 7 days centered around today (3 days before, today, 3 days after)
 */
function getCurrentWeek(scores: DailyScoreData[]): DailyScoreData[] {
  const result: DailyScoreData[] = [];
  const scoreMap = new Map(scores.map(s => [s.date, s]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 3 days before, today, 3 days after (today in middle)
  for (let i = -3; i <= 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0]!;

    const existing = scoreMap.get(dateStr);
    if (existing) {
      result.push(existing);
    } else {
      result.push({
        date: dateStr,
        bodyScore: 0,
        mindScore: 0,
        balanceIndex: 0,
        bodyComplete: false,
        mindComplete: false,
      });
    }
  }

  return result;
}

/**
 * Get calendar month data organized by weeks
 */
function getCalendarMonth(scores: DailyScoreData[]): { weeks: DailyScoreData[][]; monthName: string } {
  const scoreMap = new Map(scores.map(s => [s.date, s]));

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // First day of month
  const firstDay = new Date(year, month, 1);
  // Last day of month
  const lastDay = new Date(year, month + 1, 0);

  // Find the Monday before or on the first day
  const firstDayOfWeek = firstDay.getDay();
  const startOffset = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() + startOffset);

  const weeks: DailyScoreData[][] = [];
  let currentDate = new Date(calendarStart);

  // Generate weeks until we pass the last day of the month
  while (currentDate <= lastDay || currentDate.getDay() !== 1) {
    const week: DailyScoreData[] = [];

    for (let i = 0; i < 7; i++) {
      const dateStr = currentDate.toISOString().split('T')[0]!;
      const isCurrentMonth = currentDate.getMonth() === month;

      const existing = scoreMap.get(dateStr);
      if (existing) {
        week.push({ ...existing, _isCurrentMonth: isCurrentMonth } as DailyScoreData & { _isCurrentMonth?: boolean });
      } else {
        week.push({
          date: dateStr,
          bodyScore: 0,
          mindScore: 0,
          balanceIndex: 0,
          bodyComplete: false,
          mindComplete: false,
          _isCurrentMonth: isCurrentMonth,
        } as DailyScoreData & { _isCurrentMonth?: boolean });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    weeks.push(week);

    // Stop if we've completed the month
    if (currentDate.getMonth() !== month && currentDate.getDay() === 1) {
      break;
    }
  }

  return { weeks, monthName };
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

  // Get chart data based on time range
  const weekData = getCurrentWeek(scores);
  const calendarData = getCalendarMonth(scores);

  // Calculate week-over-week comparison for balance trend
  // Only use days with actual data for average calculations
  const thisWeekScores = scores.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff < 7;
  });
  const lastWeekScores = scores.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 7 && daysDiff < 14;
  });

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

      {/* Weekly/Monthly Overview */}
      <GlassCard hover={false} className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-6">
          {timeRange === 'week' ? 'This Week' : timeRange === 'month' ? calendarData.monthName : 'All Time'}
        </h2>

        {timeRange === 'week' ? (
          /* Weekly Bar Chart */
          <>
            <div className="flex items-end justify-between gap-2 h-40 mb-4">
              {weekData.map((day, i) => {
                const hasActivity = day.bodyScore > 0 || day.mindScore > 0;
                const bodyHeight = day.bodyScore > 0 ? (day.bodyScore / 100) * 100 : 0;
                const mindHeight = day.mindScore > 0 ? (day.mindScore / 100) * 100 : 0;
                const todayStr = new Date().toISOString().split('T')[0]!;
                const isToday = day.date === todayStr;
                const isFuture = day.date > todayStr;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div className="flex gap-1 h-full items-end">
                      {isFuture ? (
                        /* Future day - dashed outline */
                        <div className="flex gap-1 items-center mb-1">
                          <div className="w-6 h-6 rounded border border-dashed border-surface-lighter" />
                        </div>
                      ) : hasActivity ? (
                        <>
                          {/* Body bar */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${bodyHeight}%` }}
                            transition={{ delay: i * 0.05, duration: 0.4 }}
                            className="w-3 rounded-t bg-body"
                            style={{ minHeight: bodyHeight > 0 ? '8px' : 0 }}
                          />
                          {/* Mind bar */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${mindHeight}%` }}
                            transition={{ delay: i * 0.05 + 0.1, duration: 0.4 }}
                            className="w-3 rounded-t bg-mind"
                            style={{ minHeight: mindHeight > 0 ? '8px' : 0 }}
                          />
                        </>
                      ) : (
                        /* Past day with no activity - dot */
                        <div className="flex gap-1 items-center mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-surface-lighter" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Day labels */}
            <div className="flex justify-between">
              {weekData.map((day) => {
                const labels = formatDayLabel(day.date);
                const todayStr = new Date().toISOString().split('T')[0]!;
                const isToday = day.date === todayStr;
                const isFuture = day.date > todayStr;
                const hasActivity = day.bodyScore > 0 || day.mindScore > 0;
                return (
                  <div key={day.date} className="flex-1 text-center">
                    <p className={`text-xs ${isToday ? 'text-text-primary font-medium' : isFuture ? 'text-text-muted/30' : hasActivity ? 'text-text-secondary' : 'text-text-muted/50'}`}>
                      {labels.day}
                    </p>
                    <p className={`text-xs ${isToday ? 'text-body font-medium' : isFuture ? 'text-text-muted/30' : hasActivity ? 'text-text-muted' : 'text-text-muted/50'}`}>
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
        ) : timeRange === 'month' ? (
          /* Monthly Calendar Grid */
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-xs text-text-muted font-medium py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar weeks */}
            <div className="space-y-1">
              {calendarData.weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day) => {
                    const todayStr = new Date().toISOString().split('T')[0]!;
                    const isToday = day.date === todayStr;
                    const isFuture = day.date > todayStr;
                    const isCurrentMonth = day._isCurrentMonth !== false;
                    const hasBody = day.bodyComplete || day.bodyScore > 0;
                    const hasMind = day.mindComplete || day.mindScore > 0;
                    const hasActivity = hasBody || hasMind;
                    const dayNum = new Date(day.date).getDate();

                    return (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: weekIndex * 0.05 }}
                        className={`
                          aspect-square rounded-lg flex flex-col items-center justify-center relative
                          ${isToday ? 'ring-2 ring-body' : ''}
                          ${!isCurrentMonth ? 'opacity-30' : ''}
                          ${isFuture ? 'bg-transparent' : hasActivity ? 'bg-surface-light' : 'bg-surface/50'}
                        `}
                      >
                        <span className={`text-sm ${isToday ? 'text-body font-bold' : isCurrentMonth ? 'text-text-secondary' : 'text-text-muted'}`}>
                          {dayNum}
                        </span>

                        {/* Activity indicators */}
                        {!isFuture && hasActivity && (
                          <div className="flex gap-0.5 mt-0.5">
                            {hasBody && <div className="w-1.5 h-1.5 rounded-full bg-body" />}
                            {hasMind && <div className="w-1.5 h-1.5 rounded-full bg-mind" />}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-body" />
                <span className="text-xs text-text-muted">Body</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-mind" />
                <span className="text-xs text-text-muted">Mind</span>
              </div>
            </div>
          </>
        ) : (
          /* All Time - show summary message */
          <div className="text-center py-8">
            <p className="text-4xl font-bold text-text-primary mb-2">{summary?.daysWithData || 0}</p>
            <p className="text-text-muted">days tracked</p>
            <div className="flex justify-center gap-8 mt-6">
              <div>
                <p className="text-2xl font-semibold text-body">{summary?.bodyCompleteDays || 0}</p>
                <p className="text-xs text-text-muted">Body days</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-mind">{summary?.mindCompleteDays || 0}</p>
                <p className="text-xs text-text-muted">Mind days</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-text-primary">{summary?.perfectDays || 0}</p>
                <p className="text-xs text-text-muted">Perfect days</p>
              </div>
            </div>
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
