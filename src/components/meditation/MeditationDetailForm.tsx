'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface ExternalMeditation {
  id: string;
  source: string;
  externalId: string;
  name: string;
  durationMinutes: number;
  startTime: string;
}

interface SelectedHabit {
  id: string;
  name: string;
  points: number;
}

interface MeditationDetailFormProps {
  externalMeditation?: ExternalMeditation | null;
  selectedHabit?: SelectedHabit | null;
  linkToHabitId?: string | null;
  quickAdd?: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

const MIND_COLOR = '#7C9EE9';

const TECHNIQUES = [
  { value: 'BREATHING', label: 'Breathing', emoji: '🌬️' },
  { value: 'GUIDED', label: 'Guided', emoji: '🎧' },
  { value: 'BODY_SCAN', label: 'Body Scan', emoji: '🧘' },
  { value: 'MINDFULNESS', label: 'Mindfulness', emoji: '🧠' },
  { value: 'VISUALIZATION', label: 'Visualization', emoji: '🌅' },
  { value: 'MANTRA', label: 'Mantra', emoji: '🕉️' },
  { value: 'OTHER', label: 'Other', emoji: '✨' },
];

const MOODS = [
  { value: 'STRESSED', label: 'Stressed', emoji: '😫' },
  { value: 'LOW', label: 'Low', emoji: '😕' },
  { value: 'NEUTRAL', label: 'Neutral', emoji: '😐' },
  { value: 'GOOD', label: 'Good', emoji: '🙂' },
  { value: 'GREAT', label: 'Great', emoji: '😊' },
];

const DURATION_PRESETS = [5, 10, 15, 20, 30];

const GUIDED_APPS = ['Headspace', 'Calm', 'Whoop', 'Insight Timer', 'Other'];

export function MeditationDetailForm({
  externalMeditation,
  selectedHabit,
  linkToHabitId,
  quickAdd,
  onComplete,
  onCancel,
}: MeditationDetailFormProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(() => {
    if (externalMeditation) return externalMeditation.name;
    if (selectedHabit) return selectedHabit.name;
    return '';
  });
  const [durationMinutes, setDurationMinutes] = useState<number>(() => {
    if (externalMeditation) return externalMeditation.durationMinutes;
    return 10;
  });
  const [technique, setTechnique] = useState<string | null>(null);
  const [moodBefore, setMoodBefore] = useState<string | null>(null);
  const [moodAfter, setMoodAfter] = useState<string | null>(null);
  const [guidedApp, setGuidedApp] = useState<string | null>(
    externalMeditation?.source === 'WHOOP' ? 'Whoop' : null
  );
  const [notes, setNotes] = useState('');
  const [points, setPoints] = useState(() => {
    if (selectedHabit) return selectedHabit.points;
    return 25;
  });
  const [saveAsHabit, setSaveAsHabit] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() && !selectedHabit && !linkToHabitId) {
      setError('Please enter a name for this meditation');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const meditationDetails = {
        durationMinutes,
        technique: technique || undefined,
        moodBefore: moodBefore || undefined,
        moodAfter: moodAfter || undefined,
        guidedApp: guidedApp || undefined,
        notes: notes.trim() || undefined,
        source: externalMeditation?.source || 'MANUAL',
        externalId: externalMeditation?.externalId,
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
            details: notes.trim() || undefined,
            meditationDetails,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Failed to log meditation');
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
            name: name.trim(),
            pillar: 'MIND',
            subCategory: 'MEDITATION',
            points,
            isHabit: saveAsHabit,
            description: notes.trim() || undefined,
          }),
        });

        if (!createResponse.ok) {
          const data = await createResponse.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Failed to create meditation');
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
            details: notes.trim() || undefined,
            meditationDetails,
          }),
        });

        if (!completeResponse.ok) {
          const data = await completeResponse.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Failed to log meditation');
        }
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log meditation');
    } finally {
      setIsLoading(false);
    }
  };

  const isHabitMode = !!(selectedHabit || linkToHabitId);

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Name (only for custom meditation) */}
      {!isHabitMode && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Session Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Morning meditation"
            className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': MIND_COLOR } as React.CSSProperties}
          />
        </div>
      )}

      {/* Habit name display */}
      {isHabitMode && selectedHabit && (
        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-xl">
          <span className="text-2xl">🧘</span>
          <span className="font-medium text-text-primary">{selectedHabit.name}</span>
        </div>
      )}

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Duration
        </label>
        <div className="flex gap-2 mb-3">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setDurationMinutes(preset)}
              className={`flex-1 py-2 rounded-lg border transition-all ${
                durationMinutes === preset
                  ? 'border-current bg-opacity-20'
                  : 'border-surface-lighter bg-surface-light'
              }`}
              style={{
                borderColor: durationMinutes === preset ? MIND_COLOR : undefined,
                backgroundColor: durationMinutes === preset ? `${MIND_COLOR}20` : undefined,
                color: durationMinutes === preset ? MIND_COLOR : undefined,
              }}
            >
              {preset}m
            </button>
          ))}
        </div>
        <input
          type="range"
          min="1"
          max="60"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${MIND_COLOR} 0%, ${MIND_COLOR} ${(durationMinutes / 60) * 100}%, rgba(255,255,255,0.1) ${(durationMinutes / 60) * 100}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-text-muted">1 min</span>
          <span className="text-lg font-bold" style={{ color: MIND_COLOR }}>{durationMinutes} min</span>
          <span className="text-xs text-text-muted">60 min</span>
        </div>
      </div>

      {/* Technique */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Technique <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TECHNIQUES.map((tech) => (
            <button
              key={tech.value}
              type="button"
              onClick={() => setTechnique(technique === tech.value ? null : tech.value)}
              className={`p-2 rounded-xl border transition-all text-center ${
                technique === tech.value
                  ? 'border-current bg-opacity-20'
                  : 'border-surface-lighter bg-surface-light hover:border-surface-lighter/80'
              }`}
              style={{
                borderColor: technique === tech.value ? MIND_COLOR : undefined,
                backgroundColor: technique === tech.value ? `${MIND_COLOR}20` : undefined,
              }}
            >
              <span className="block text-lg">{tech.emoji}</span>
              <span className={`block text-xs mt-1 ${technique === tech.value ? '' : 'text-text-muted'}`}
                style={{ color: technique === tech.value ? MIND_COLOR : undefined }}>
                {tech.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mood Before/After */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3">
            Mood Before
          </label>
          <div className="flex gap-1">
            {MOODS.map((mood) => (
              <button
                key={mood.value}
                type="button"
                onClick={() => setMoodBefore(moodBefore === mood.value ? null : mood.value)}
                className={`flex-1 p-2 rounded-lg border transition-all ${
                  moodBefore === mood.value
                    ? 'border-current bg-opacity-20'
                    : 'border-surface-lighter bg-surface-light'
                }`}
                style={{
                  borderColor: moodBefore === mood.value ? MIND_COLOR : undefined,
                  backgroundColor: moodBefore === mood.value ? `${MIND_COLOR}20` : undefined,
                }}
                title={mood.label}
              >
                <span className="text-lg">{mood.emoji}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3">
            Mood After
          </label>
          <div className="flex gap-1">
            {MOODS.map((mood) => (
              <button
                key={mood.value}
                type="button"
                onClick={() => setMoodAfter(moodAfter === mood.value ? null : mood.value)}
                className={`flex-1 p-2 rounded-lg border transition-all ${
                  moodAfter === mood.value
                    ? 'border-current bg-opacity-20'
                    : 'border-surface-lighter bg-surface-light'
                }`}
                style={{
                  borderColor: moodAfter === mood.value ? MIND_COLOR : undefined,
                  backgroundColor: moodAfter === mood.value ? `${MIND_COLOR}20` : undefined,
                }}
                title={mood.label}
              >
                <span className="text-lg">{mood.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Guided App (only if guided technique) */}
      {technique === 'GUIDED' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Guided App
          </label>
          <div className="flex flex-wrap gap-2">
            {GUIDED_APPS.map((app) => (
              <button
                key={app}
                type="button"
                onClick={() => setGuidedApp(guidedApp === app ? null : app)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  guidedApp === app
                    ? 'border-current'
                    : 'border-surface-lighter bg-surface-light'
                }`}
                style={{
                  borderColor: guidedApp === app ? MIND_COLOR : undefined,
                  backgroundColor: guidedApp === app ? `${MIND_COLOR}20` : undefined,
                  color: guidedApp === app ? MIND_COLOR : undefined,
                }}
              >
                {app}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Notes <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel?"
          rows={2}
          className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': MIND_COLOR } as React.CSSProperties}
        />
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

      {/* Save as Habit Toggle (only for new meditations) */}
      {!isHabitMode && (
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Save as habit
            </label>
            <p className="text-xs text-text-muted mt-0.5">
              Track this meditation regularly
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
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: MIND_COLOR }}
        >
          {isLoading ? 'Saving...' : 'Log Meditation'}
        </button>
      </div>
    </form>
  );
}
