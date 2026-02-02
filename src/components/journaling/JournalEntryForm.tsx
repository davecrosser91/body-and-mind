'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SelectedHabit {
  id: string;
  name: string;
  points: number;
}

interface JournalEntryFormProps {
  selectedHabit?: SelectedHabit | null;
  linkToHabitId?: string | null;
  quickAdd?: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

const MIND_COLOR = '#7C9EE9';

const ENTRY_TYPES = [
  { value: 'GRATITUDE', label: 'Gratitude', emoji: '🙏', placeholder: 'What are you grateful for today?' },
  { value: 'REFLECTION', label: 'Reflection', emoji: '💭', placeholder: "What's on your mind?" },
  { value: 'FREE_WRITE', label: 'Free Write', emoji: '✍️', placeholder: 'Just write...' },
  { value: 'MORNING_PAGES', label: 'Morning Pages', emoji: '🌅', placeholder: 'Start your day with clarity...' },
  { value: 'EVENING_REVIEW', label: 'Evening Review', emoji: '🌙', placeholder: 'How did today go?' },
];

const MOODS = [
  { value: 'STRESSED', label: 'Stressed', emoji: '😫' },
  { value: 'LOW', label: 'Low', emoji: '😕' },
  { value: 'NEUTRAL', label: 'Neutral', emoji: '😐' },
  { value: 'GOOD', label: 'Good', emoji: '🙂' },
  { value: 'GREAT', label: 'Great', emoji: '😊' },
];

export function JournalEntryForm({
  selectedHabit,
  linkToHabitId,
  quickAdd,
  onComplete,
  onCancel,
}: JournalEntryFormProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [entryType, setEntryType] = useState<string>('GRATITUDE');
  const [mood, setMood] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [points, setPoints] = useState(() => {
    if (selectedHabit) return selectedHabit.points;
    return 25;
  });
  const [saveAsHabit, setSaveAsHabit] = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const selectedEntryType = ENTRY_TYPES.find(t => t.value === entryType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Please write something before saving');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const journalEntryData = {
        entryType,
        mood: mood || undefined,
        content: content.trim(),
        wordCount,
      };

      if (linkToHabitId || selectedHabit) {
        // Complete existing habit
        const habitId = linkToHabitId || selectedHabit?.id;
        const response = await fetch(`/api/v1/activities/${habitId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            details: `${selectedEntryType?.label} - ${wordCount} words`,
            journalEntry: journalEntryData,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Failed to save journal entry');
        }
      } else {
        // Create new activity and complete it
        const createResponse = await fetch('/api/v1/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: `${selectedEntryType?.label} Journal`,
            pillar: 'MIND',
            subCategory: 'JOURNALING',
            points,
            isHabit: saveAsHabit,
          }),
        });

        if (!createResponse.ok) {
          const data = await createResponse.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Failed to create journal entry');
        }

        const activityData = await createResponse.json();
        const activityId = activityData.data?.id;

        // Complete the activity
        const completeResponse = await fetch(`/api/v1/activities/${activityId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            details: `${selectedEntryType?.label} - ${wordCount} words`,
            journalEntry: journalEntryData,
          }),
        });

        if (!completeResponse.ok) {
          const data = await completeResponse.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Failed to save journal entry');
        }
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save journal entry');
    } finally {
      setIsLoading(false);
    }
  };

  const isHabitMode = !!(selectedHabit || linkToHabitId);

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Habit name display */}
      {isHabitMode && selectedHabit && (
        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-xl">
          <span className="text-2xl">📝</span>
          <span className="font-medium text-text-primary">{selectedHabit.name}</span>
        </div>
      )}

      {/* Entry Type */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Entry Type
        </label>
        <div className="flex flex-wrap gap-2">
          {ENTRY_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setEntryType(type.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                entryType === type.value
                  ? 'border-current bg-opacity-20'
                  : 'border-surface-lighter bg-surface-light'
              }`}
              style={{
                borderColor: entryType === type.value ? MIND_COLOR : undefined,
                backgroundColor: entryType === type.value ? `${MIND_COLOR}20` : undefined,
                color: entryType === type.value ? MIND_COLOR : undefined,
              }}
            >
              <span>{type.emoji}</span>
              <span className="text-sm">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          How are you feeling? <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <div className="flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(mood === m.value ? null : m.value)}
              className={`flex-1 p-3 rounded-xl border transition-all ${
                mood === m.value
                  ? 'border-current bg-opacity-20'
                  : 'border-surface-lighter bg-surface-light'
              }`}
              style={{
                borderColor: mood === m.value ? MIND_COLOR : undefined,
                backgroundColor: mood === m.value ? `${MIND_COLOR}20` : undefined,
              }}
              title={m.label}
            >
              <span className="text-2xl">{m.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Your Entry
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={selectedEntryType?.placeholder || 'Start writing...'}
          rows={8}
          className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': MIND_COLOR } as React.CSSProperties}
          autoFocus
        />
        <div className="flex justify-end mt-2">
          <span className="text-sm text-text-muted">{wordCount} words</span>
        </div>
      </div>

      {/* Points */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Points {isHabitMode && <span className="text-text-muted font-normal">(from habit)</span>}
        </label>
        {isHabitMode ? (
          <div className="flex items-center justify-center p-4 bg-surface-light/50 rounded-xl border border-surface-lighter">
            <span className="text-3xl font-bold text-text-muted">{points}</span>
            <span className="text-lg text-text-muted ml-2">pts</span>
          </div>
        ) : (
          <>
            <input
              type="range"
              min="1"
              max="100"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${MIND_COLOR} 0%, ${MIND_COLOR} ${points}%, rgba(255,255,255,0.1) ${points}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-text-muted">1</span>
              <span className="text-lg font-bold" style={{ color: MIND_COLOR }}>{points} pts</span>
              <span className="text-xs text-text-muted">100</span>
            </div>
          </>
        )}
      </div>

      {/* Save as Habit Toggle (only for new entries) */}
      {!isHabitMode && (
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Save as habit
            </label>
            <p className="text-xs text-text-muted mt-0.5">
              Track this journal type regularly
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSaveAsHabit(!saveAsHabit)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              saveAsHabit ? '' : 'bg-surface-lighter'
            }`}
            style={{ backgroundColor: saveAsHabit ? MIND_COLOR : undefined }}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                saveAsHabit ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl border border-surface-lighter text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="flex-1 px-4 py-3 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: MIND_COLOR }}
        >
          {isLoading ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </form>
  );
}
