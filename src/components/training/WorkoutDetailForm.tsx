'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface ExternalWorkout {
  id: string;
  source: string;
  externalId: string;
  name: string;
  workoutType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  strain?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  hrZones?: Record<string, number>;
}

interface TrainingTemplate {
  id: string;
  name: string;
  points: number;
  trainingDefaults?: {
    workoutType?: string;
    durationMinutes?: number;
    intensity?: string;
    muscleGroups?: string[];
    location?: string;
  } | null;
}

interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  weight?: number;
  notes?: string;
}

interface SelectedHabit {
  id: string;
  name: string;
  points: number;
}

interface WorkoutDetailFormProps {
  externalWorkout?: ExternalWorkout | null;
  template?: TrainingTemplate | null;
  selectedHabit?: SelectedHabit | null;
  linkToHabitId?: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

const BODY_COLOR = '#E8A854';

const WORKOUT_TYPES = [
  { value: 'STRENGTH', label: 'Strength', emoji: '🏋️' },
  { value: 'CARDIO', label: 'Cardio', emoji: '🏃' },
  { value: 'HIIT', label: 'HIIT', emoji: '⚡' },
  { value: 'YOGA', label: 'Yoga', emoji: '🧘' },
  { value: 'SPORTS', label: 'Sports', emoji: '🏀' },
  { value: 'WALK', label: 'Walk', emoji: '🚶' },
  { value: 'STRETCH', label: 'Stretch', emoji: '🤸' },
  { value: 'OTHER', label: 'Other', emoji: '💪' },
];

const INTENSITIES = [
  { value: 'LIGHT', label: 'Light' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'HARD', label: 'Hard' },
  { value: 'MAX', label: 'Max' },
];

const MUSCLE_GROUPS = [
  { value: 'UPPER', label: 'Upper' },
  { value: 'LOWER', label: 'Lower' },
  { value: 'CORE', label: 'Core' },
  { value: 'FULL_BODY', label: 'Full Body' },
];

const LOCATIONS = [
  { value: 'GYM', label: 'Gym' },
  { value: 'HOME', label: 'Home' },
  { value: 'OUTDOOR', label: 'Outdoor' },
  { value: 'OTHER', label: 'Other' },
];

export function WorkoutDetailForm({
  externalWorkout,
  template,
  selectedHabit,
  linkToHabitId,
  onComplete,
  onCancel,
}: WorkoutDetailFormProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Form state - initialize from props if available
  const [name, setName] = useState(() => {
    if (externalWorkout) return externalWorkout.name;
    if (template) return template.name;
    if (selectedHabit) return selectedHabit.name;
    return '';
  });
  const [workoutType, setWorkoutType] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [intensity, setIntensity] = useState<string | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const [avgHeartRate, setAvgHeartRate] = useState<number | null>(null);
  const [maxHeartRate, setMaxHeartRate] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [notes, setNotes] = useState('');
  const [points, setPoints] = useState(() => {
    if (selectedHabit) return selectedHabit.points;
    if (template) return template.points;
    if (externalWorkout) return 25;
    return 25;
  });
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  // Initialize form with external workout, template, or selected habit data
  useEffect(() => {
    if (externalWorkout) {
      setName(externalWorkout.name);
      setWorkoutType(externalWorkout.workoutType || null);
      setDurationMinutes(externalWorkout.durationMinutes);
      setAvgHeartRate(externalWorkout.avgHeartRate || null);
      setMaxHeartRate(externalWorkout.maxHeartRate || null);
      setPoints(25); // Default, user can change
    } else if (template) {
      setName(template.name);
      setPoints(template.points);
      if (template.trainingDefaults) {
        setWorkoutType(template.trainingDefaults.workoutType || null);
        setDurationMinutes(template.trainingDefaults.durationMinutes || null);
        setIntensity(template.trainingDefaults.intensity || null);
        setMuscleGroups(template.trainingDefaults.muscleGroups || []);
        setLocation(template.trainingDefaults.location || null);
      }
    } else if (selectedHabit) {
      setName(selectedHabit.name);
      setPoints(selectedHabit.points);
    }
  }, [externalWorkout, template, selectedHabit]);

  const toggleMuscleGroup = (value: string) => {
    setMuscleGroups((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const addExercise = () => {
    setExercises((prev) => [...prev, { name: '', sets: undefined, reps: undefined }]);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number | undefined) => {
    setExercises((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (!current) return prev;
      updated[index] = {
        ...current,
        [field]: value,
        name: field === 'name' ? (value as string) || '' : current.name
      };
      return updated;
    });
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a workout name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build training details
      const trainingDetails = {
        workoutType: workoutType || undefined,
        durationMinutes: durationMinutes || undefined,
        intensity: intensity || undefined,
        muscleGroups: muscleGroups.length > 0 ? muscleGroups : undefined,
        location: location || undefined,
        rpe: rpe || undefined,
        avgHeartRate: avgHeartRate || undefined,
        maxHeartRate: maxHeartRate || undefined,
        calories: externalWorkout?.calories || undefined,
        hrZones: externalWorkout?.hrZones || undefined,
        exercises: exercises.filter((e) => e.name.trim()).length > 0
          ? exercises.filter((e) => e.name.trim())
          : undefined,
        source: externalWorkout?.source,
        externalWorkoutId: externalWorkout?.externalId,
        externalData: externalWorkout ? { strain: externalWorkout.strain } : undefined,
      };

      if (linkToHabitId && externalWorkout) {
        // Link external workout to existing habit
        const response = await fetch('/api/v1/training/link-external', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            activityId: linkToHabitId,
            externalWorkout: {
              source: externalWorkout.source,
              externalId: externalWorkout.externalId,
              name: externalWorkout.name,
              workoutType: workoutType || externalWorkout.workoutType,
              durationMinutes: externalWorkout.durationMinutes,
              strain: externalWorkout.strain,
              avgHeartRate: externalWorkout.avgHeartRate,
              maxHeartRate: externalWorkout.maxHeartRate,
              calories: externalWorkout.calories,
              hrZones: externalWorkout.hrZones,
            },
            overrides: {
              workoutType: workoutType || undefined,
              intensity: intensity || undefined,
              muscleGroups: muscleGroups.length > 0 ? muscleGroups : undefined,
              location: location || undefined,
              rpe: rpe || undefined,
              notes: notes.trim() || undefined,
            },
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Failed to link workout');
        }
      } else if (linkToHabitId) {
        // Complete existing habit (no external workout)
        const response = await fetch(`/api/v1/activities/${linkToHabitId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            details: notes.trim() || undefined,
            trainingDetails,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Failed to log workout');
        }
      } else if (template) {
        // Complete template activity
        const response = await fetch(`/api/v1/activities/${template.id}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            details: notes.trim() || undefined,
            trainingDetails,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Failed to log workout');
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
            pillar: 'BODY',
            subCategory: 'TRAINING',
            points,
            isHabit: saveAsTemplate,
            description: notes.trim() || undefined,
          }),
        });

        if (!createResponse.ok) {
          const data = await createResponse.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Failed to create workout');
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
            trainingDetails,
          }),
        });

        if (!completeResponse.ok) {
          const data = await completeResponse.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Failed to log workout');
        }

        // Create training template if saving as template
        if (saveAsTemplate) {
          await fetch('/api/v1/training/templates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: name.trim(),
              points,
              trainingDefaults: {
                workoutType: workoutType || undefined,
                durationMinutes: durationMinutes || undefined,
                intensity: intensity || undefined,
                muscleGroups: muscleGroups.length > 0 ? muscleGroups : undefined,
                location: location || undefined,
              },
            }),
          }).catch(() => {
            // Silently fail template creation
          });
        }
      }

      setShowSaveSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log workout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Success overlay */}
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-surface/95 flex items-center justify-center z-10"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
              >
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <p className="text-text-primary font-medium">Workout logged!</p>
              <p className="text-text-muted text-sm">+{points} pts</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workout Name */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Workout Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Morning Strength, Zone 2 Run"
          className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
        />
      </div>

      {/* Workout Type */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Workout Type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {WORKOUT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setWorkoutType(workoutType === type.value ? null : type.value)}
              className={`p-2 rounded-lg border-2 transition-all text-center ${
                workoutType === type.value
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-surface-lighter bg-surface-light hover:border-surface-lighter/80'
              }`}
            >
              <span className="block text-lg">{type.emoji}</span>
              <span className={`block text-xs mt-1 ${workoutType === type.value ? 'text-amber-500' : 'text-text-muted'}`}>
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration & Intensity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Duration (min)
          </label>
          <input
            type="number"
            value={durationMinutes || ''}
            onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="45"
            className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Intensity
          </label>
          <select
            value={intensity || ''}
            onChange={(e) => setIntensity(e.target.value || null)}
            className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:border-transparent appearance-none"
            style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
          >
            <option value="">Select...</option>
            {INTENSITIES.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* More Details Toggle */}
      <button
        type="button"
        onClick={() => setShowMoreDetails(!showMoreDetails)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-secondary hover:text-text-primary transition-colors"
      >
        <span className="text-sm font-medium">
          {showMoreDetails ? '▲' : '▼'} More Details
        </span>
        {(muscleGroups.length > 0 || exercises.length > 0 || rpe || location) && (
          <span className="text-xs text-amber-500">
            {[
              muscleGroups.length > 0 && `${muscleGroups.length} muscle groups`,
              exercises.length > 0 && `${exercises.length} exercises`,
              rpe && `RPE ${rpe}`,
              location,
            ].filter(Boolean).join(' • ')}
          </span>
        )}
      </button>

      {/* More Details Section */}
      <AnimatePresence>
        {showMoreDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Muscle Groups */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Muscle Groups
              </label>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((mg) => (
                  <button
                    key={mg.value}
                    type="button"
                    onClick={() => toggleMuscleGroup(mg.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      muscleGroups.includes(mg.value)
                        ? 'bg-amber-500 text-white'
                        : 'bg-surface-light text-text-secondary border border-surface-lighter hover:border-amber-500/50'
                    }`}
                  >
                    {mg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercises */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Exercises
              </label>
              <div className="space-y-2">
                {exercises.map((exercise, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      placeholder="Exercise name"
                      className="flex-1 px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1"
                      style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
                    />
                    <input
                      type="number"
                      value={exercise.sets || ''}
                      onChange={(e) => updateExercise(index, 'sets', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Sets"
                      className="w-16 px-2 py-2 bg-surface-light border border-surface-lighter rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 text-center"
                      style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
                    />
                    <input
                      type="text"
                      value={exercise.reps || ''}
                      onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                      placeholder="Reps"
                      className="w-16 px-2 py-2 bg-surface-light border border-surface-lighter rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 text-center"
                      style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
                    />
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      className="p-2 text-text-muted hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExercise}
                  className="w-full py-2 border border-dashed border-surface-lighter rounded-lg text-sm text-text-muted hover:text-text-secondary hover:border-amber-500/50 transition-colors"
                >
                  + Add Exercise
                </button>
              </div>
            </div>

            {/* RPE */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                RPE (Rate of Perceived Effort)
              </label>
              <div className="flex justify-between gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRpe(rpe === num ? null : num)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                      rpe === num
                        ? 'bg-amber-500 text-white'
                        : 'bg-surface-light text-text-muted hover:bg-surface-lighter'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>Easy</span>
                <span>Moderate</span>
                <span>Max</span>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Location
              </label>
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.value}
                    type="button"
                    onClick={() => setLocation(location === loc.value ? null : loc.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      location === loc.value
                        ? 'bg-amber-500 text-white'
                        : 'bg-surface-light text-text-secondary border border-surface-lighter hover:border-amber-500/50'
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Heart Rate (from Whoop) */}
            {(avgHeartRate || maxHeartRate || externalWorkout?.hrZones) && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Heart Rate (from Whoop)
                </label>
                <div className="flex gap-4">
                  {avgHeartRate && (
                    <div className="px-3 py-2 bg-surface-light rounded-lg">
                      <span className="text-text-muted text-sm">Avg: </span>
                      <span className="text-text-primary font-medium">{avgHeartRate} bpm</span>
                    </div>
                  )}
                  {maxHeartRate && (
                    <div className="px-3 py-2 bg-surface-light rounded-lg">
                      <span className="text-text-muted text-sm">Max: </span>
                      <span className="text-text-primary font-medium">{maxHeartRate} bpm</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Points */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Points {(selectedHabit || template) ? (
            <span className="text-text-muted font-normal">(from {selectedHabit ? 'habit' : 'template'})</span>
          ) : (
            <span className="text-text-muted font-normal">(daily goal: 100 per pillar)</span>
          )}
        </label>
        {(selectedHabit || template) ? (
          /* Locked points display for habits/templates */
          <div className="flex items-center justify-center p-4 bg-surface-light/50 rounded-xl border border-surface-lighter">
            <span className="text-3xl font-bold text-text-muted">{points}</span>
            <span className="text-lg text-text-muted ml-2">pts</span>
          </div>
        ) : (
          /* Editable points for custom workouts */
          <>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { value: 10, label: 'Light' },
                { value: 25, label: 'Regular' },
                { value: 50, label: 'Important' },
                { value: 100, label: 'Essential' },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setPoints(preset.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    points === preset.value
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-surface-lighter bg-surface-light hover:border-surface-lighter/80'
                  }`}
                >
                  <span className={`block text-lg font-bold ${points === preset.value ? 'text-amber-500' : 'text-text-primary'}`}>
                    {preset.value}
                  </span>
                  <span className={`block text-xs ${points === preset.value ? 'text-amber-500/80' : 'text-text-muted'}`}>
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${BODY_COLOR} 0%, ${BODY_COLOR} ${points}%, rgba(255,255,255,0.1) ${points}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-text-muted">1</span>
              <span className="text-lg font-bold" style={{ color: BODY_COLOR }}>{points} pts</span>
              <span className="text-xs text-text-muted">100</span>
            </div>
          </>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Notes <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any details..."
          rows={2}
          className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
        />
      </div>

      {/* Save as Template Toggle (only for new workouts) */}
      {!template && !linkToHabitId && (
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Save as template
            </label>
            <p className="text-xs text-text-muted mt-0.5">
              Quick access next time
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSaveAsTemplate(!saveAsTemplate)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              saveAsTemplate ? '' : 'bg-surface-lighter'
            }`}
            style={{ backgroundColor: saveAsTemplate ? BODY_COLOR : undefined }}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                saveAsTemplate ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-400"
        >
          {error}
        </motion.p>
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
          disabled={isLoading || !name.trim()}
          className="flex-1 px-4 py-3 rounded-xl font-medium text-background transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: BODY_COLOR }}
        >
          {isLoading ? 'Logging...' : 'Log Workout'}
        </button>
      </div>
    </form>
  );
}
