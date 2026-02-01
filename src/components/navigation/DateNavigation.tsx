'use client';

import { motion } from 'framer-motion';

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isToday: boolean;
  pillarColor?: string;
}

/**
 * Format date for display
 */
function formatDate(date: Date, isToday: boolean): string {
  if (isToday) {
    return 'Today';
  }

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday';
  }

  // Format as "Mon, Jan 15"
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date for input value (YYYY-MM-DD)
 */
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DateNavigation({
  currentDate,
  onDateChange,
  isToday,
  pillarColor = '#E8A854',
}: DateNavigationProps) {
  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    if (isToday) return; // Can't go to future
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if (!dateStr) return;

    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return;

    const newDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Don't allow future dates
    if (newDate > today) return;

    onDateChange(newDate);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous Day Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handlePrevDay}
        className="p-2 rounded-lg bg-surface-light text-text-muted hover:text-text-primary hover:bg-surface-lighter transition-colors"
        aria-label="Previous day"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </motion.button>

      {/* Date Display / Picker */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-light hover:bg-surface-lighter transition-colors min-w-[140px] justify-center"
        >
          <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-text-primary font-medium">
            {formatDate(currentDate, isToday)}
          </span>
        </motion.button>
        {/* Hidden date input for native picker */}
        <input
          type="date"
          value={formatDateForInput(currentDate)}
          onChange={handleDateInput}
          max={formatDateForInput(new Date())}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Select date"
        />
      </div>

      {/* Next Day Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleNextDay}
        disabled={isToday}
        className={`p-2 rounded-lg transition-colors ${
          isToday
            ? 'bg-surface-light text-text-muted/30 cursor-not-allowed'
            : 'bg-surface-light text-text-muted hover:text-text-primary hover:bg-surface-lighter'
        }`}
        aria-label="Next day"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>

      {/* Today Button (only show when not on today) */}
      {!isToday && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToday}
          className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: `${pillarColor}20`,
            color: pillarColor,
          }}
        >
          Today
        </motion.button>
      )}
    </div>
  );
}
