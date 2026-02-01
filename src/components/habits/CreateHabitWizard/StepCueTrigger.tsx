'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CueType, Pillar, AutoTriggerType } from '@prisma/client';
import { CreateHabitFormData, CUE_TYPE_CONFIG, BODY_COLOR, MIND_COLOR, AutoTriggerConfig } from './types';
import { useAuth } from '@/hooks/useAuth';

// Whoop workout types
const WHOOP_WORKOUT_TYPES = [
  { id: 1, name: 'Running' },
  { id: 44, name: 'Functional Fitness' },
  { id: 43, name: 'HIIT' },
  { id: 0, name: 'Weightlifting' },
  { id: 63, name: 'Meditation' },
  { id: 52, name: 'Cycling' },
  { id: 71, name: 'Yoga' },
  { id: 48, name: 'Swimming' },
  { id: 82, name: 'Walking' },
] as const;

// Auto-trigger type configuration
interface TriggerTypeConfig {
  type: AutoTriggerType;
  label: string;
  description: string;
  needsThreshold?: boolean;
  needsWorkoutType?: boolean;
  needsActivity?: boolean;
  unit?: string;
  defaultValue?: number;
}

const AUTO_TRIGGER_TYPES: TriggerTypeConfig[] = [
  { type: 'WHOOP_RECOVERY_ABOVE', label: 'Recovery above', description: 'When Whoop recovery % is at or above threshold', needsThreshold: true, unit: '%', defaultValue: 60 },
  { type: 'WHOOP_RECOVERY_BELOW', label: 'Recovery below', description: 'When Whoop recovery % is below threshold', needsThreshold: true, unit: '%', defaultValue: 50 },
  { type: 'WHOOP_SLEEP_ABOVE', label: 'Sleep more than', description: 'When Whoop sleep hours are at or above threshold', needsThreshold: true, unit: 'hours', defaultValue: 7 },
  { type: 'WHOOP_STRAIN_ABOVE', label: 'Strain above', description: 'When Whoop strain is at or above threshold', needsThreshold: true, unit: 'strain', defaultValue: 10 },
  { type: 'WHOOP_WORKOUT_TYPE', label: 'Workout logged', description: 'When a specific workout type is logged in Whoop', needsWorkoutType: true },
  { type: 'ACTIVITY_COMPLETED', label: 'Activity completed', description: 'When another activity is completed', needsActivity: true },
];

interface Activity {
  id: string;
  name: string;
  pillar: string;
}

interface StepCueTriggerProps {
  formData: CreateHabitFormData;
  onChange: <K extends keyof CreateHabitFormData>(field: K, value: CreateHabitFormData[K]) => void;
  pillar: Pillar;
}

export function StepCueTrigger({ formData, onChange, pillar }: StepCueTriggerProps) {
  const color = pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;
  const { token } = useAuth();
  const [showAutoTrigger, setShowAutoTrigger] = useState(!!formData.autoTrigger);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Fetch activities for ACTIVITY_COMPLETED trigger
  useEffect(() => {
    if (showAutoTrigger && token) {
      fetch('/api/v1/activities', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setActivities(data);
          }
        })
        .catch(console.error);
    }
  }, [showAutoTrigger, token]);

  const handleCueTypeChange = (type: CueType | null) => {
    onChange('cueType', type);
    if (!type) {
      onChange('cueValue', '');
    }
  };

  const handleAutoTriggerToggle = () => {
    if (showAutoTrigger) {
      setShowAutoTrigger(false);
      onChange('autoTrigger', null);
    } else {
      setShowAutoTrigger(true);
    }
  };

  const handleAutoTriggerTypeChange = (type: AutoTriggerType) => {
    const config = AUTO_TRIGGER_TYPES.find((c) => c.type === type);
    if (!config) return;

    const newTrigger: AutoTriggerConfig = {
      triggerType: type,
      thresholdValue: config.needsThreshold ? config.defaultValue : undefined,
      workoutTypeId: config.needsWorkoutType ? WHOOP_WORKOUT_TYPES[0].id : undefined,
      triggerActivityId: undefined,
    };
    onChange('autoTrigger', newTrigger);
  };

  const currentAutoTriggerConfig = formData.autoTrigger
    ? AUTO_TRIGGER_TYPES.find((c) => c.type === formData.autoTrigger?.triggerType)
    : null;

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-text-primary">When will you do this?</h3>
        <p className="text-sm text-text-muted mt-1">
          Set a trigger to help you remember (optional)
        </p>
      </div>

      {/* Cue Type Selection */}
      <div className="space-y-3">
        {/* No Cue Option */}
        <button
          type="button"
          onClick={() => handleCueTypeChange(null)}
          className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
          style={{
            backgroundColor: formData.cueType === null ? `${color}10` : 'transparent',
            borderColor: formData.cueType === null ? color : 'rgb(var(--surface-lighter))',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-text-primary">No trigger</p>
            <p className="text-sm text-text-muted">I&apos;ll remember on my own</p>
          </div>
          {formData.cueType === null && (
            <svg className="w-5 h-5" fill={color} viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Cue Type Options */}
        {(['TIME', 'LOCATION', 'AFTER_ACTIVITY'] as CueType[]).map((type) => {
          const config = CUE_TYPE_CONFIG[type];
          const isSelected = formData.cueType === type;
          return (
            <motion.div key={type} layout>
              <button
                type="button"
                onClick={() => handleCueTypeChange(type)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                style={{
                  backgroundColor: isSelected ? `${color}10` : 'transparent',
                  borderColor: isSelected ? color : 'rgb(var(--surface-lighter))',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{config.label}</p>
                  <p className="text-sm text-text-muted">{config.description}</p>
                </div>
                {isSelected && (
                  <svg className="w-5 h-5" fill={color} viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Cue Value Input */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 ml-16"
                >
                  {type === 'TIME' ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        value={formData.cueValue || '07:00'}
                        onChange={(e) => onChange('cueValue', e.target.value)}
                        className="px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                          text-text-primary text-lg font-mono
                          focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': color } as React.CSSProperties}
                      />
                      <span className="text-text-muted">every day</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.cueValue}
                      onChange={(e) => onChange('cueValue', e.target.value)}
                      placeholder={config.placeholder}
                      className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                        text-text-primary placeholder-text-muted
                        focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': color } as React.CSSProperties}
                    />
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Auto-Trigger Section */}
      <div className="pt-4 border-t border-surface-lighter">
        <button
          type="button"
          onClick={handleAutoTriggerToggle}
          className="w-full flex items-center justify-between px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-left transition-colors hover:bg-surface-lighter"
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke={showAutoTrigger ? color : 'currentColor'}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <span className={`text-sm font-medium ${showAutoTrigger ? '' : 'text-text-secondary'}`}>
                Auto-Complete Trigger
              </span>
              <p className="text-xs text-text-muted">Auto-complete based on Whoop data or activity</p>
            </div>
          </div>
          <motion.svg
            className="w-5 h-5 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: showAutoTrigger ? 180 : 0 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {showAutoTrigger && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* Trigger Type Select */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Auto-complete when
                  </label>
                  <select
                    value={formData.autoTrigger?.triggerType || ''}
                    onChange={(e) => handleAutoTriggerTypeChange(e.target.value as AutoTriggerType)}
                    className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                      text-text-primary focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': color } as React.CSSProperties}
                  >
                    <option value="">Select a trigger...</option>
                    <optgroup label="Whoop Data">
                      {AUTO_TRIGGER_TYPES.filter(t => t.type.startsWith('WHOOP')).map((config) => (
                        <option key={config.type} value={config.type}>
                          {config.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Activity">
                      {AUTO_TRIGGER_TYPES.filter(t => t.type === 'ACTIVITY_COMPLETED').map((config) => (
                        <option key={config.type} value={config.type}>
                          {config.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Threshold Input */}
                {currentAutoTriggerConfig?.needsThreshold && formData.autoTrigger && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Threshold ({currentAutoTriggerConfig.unit})
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={formData.autoTrigger.thresholdValue ?? ''}
                        onChange={(e) => onChange('autoTrigger', {
                          ...formData.autoTrigger!,
                          thresholdValue: parseFloat(e.target.value) || 0,
                        })}
                        min={0}
                        max={currentAutoTriggerConfig.unit === '%' ? 100 : currentAutoTriggerConfig.unit === 'strain' ? 21 : 24}
                        step={currentAutoTriggerConfig.unit === 'hours' ? 0.5 : 1}
                        className="flex-1 px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                          text-text-primary focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': color } as React.CSSProperties}
                      />
                      <span className="text-text-muted text-sm">{currentAutoTriggerConfig.unit}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{currentAutoTriggerConfig.description}</p>
                  </motion.div>
                )}

                {/* Workout Type Select */}
                {currentAutoTriggerConfig?.needsWorkoutType && formData.autoTrigger && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Workout Type
                    </label>
                    <select
                      value={formData.autoTrigger.workoutTypeId ?? ''}
                      onChange={(e) => onChange('autoTrigger', {
                        ...formData.autoTrigger!,
                        workoutTypeId: parseInt(e.target.value, 10),
                      })}
                      className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                        text-text-primary focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': color } as React.CSSProperties}
                    >
                      {WHOOP_WORKOUT_TYPES.map((workout) => (
                        <option key={workout.id} value={workout.id}>{workout.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-text-muted mt-1">{currentAutoTriggerConfig.description}</p>
                  </motion.div>
                )}

                {/* Activity Select */}
                {currentAutoTriggerConfig?.needsActivity && formData.autoTrigger && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Trigger Activity
                    </label>
                    <select
                      value={formData.autoTrigger.triggerActivityId ?? ''}
                      onChange={(e) => onChange('autoTrigger', {
                        ...formData.autoTrigger!,
                        triggerActivityId: e.target.value || undefined,
                      })}
                      className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                        text-text-primary focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': color } as React.CSSProperties}
                    >
                      <option value="">Select an activity...</option>
                      {activities.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.name} ({activity.pillar})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-text-muted mt-1">{currentAutoTriggerConfig.description}</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Atomic Habits Tip */}
      <div
        className="p-4 rounded-xl border"
        style={{ backgroundColor: `${color}05`, borderColor: `${color}30` }}
      >
        <p className="text-sm" style={{ color }}>
          <strong>Tip:</strong> Habit stacking works best with specific cues.
          &quot;After I pour my morning coffee, I will meditate for 2 minutes.&quot;
        </p>
      </div>
    </div>
  );
}
