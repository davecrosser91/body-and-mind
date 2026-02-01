'use client';

import { motion } from 'framer-motion';
import { CueType, Pillar } from '@prisma/client';
import { CreateHabitFormData, CUE_TYPE_CONFIG, BODY_COLOR, MIND_COLOR } from './types';

interface StepCueTriggerProps {
  formData: CreateHabitFormData;
  onChange: <K extends keyof CreateHabitFormData>(field: K, value: CreateHabitFormData[K]) => void;
  pillar: Pillar;
}

export function StepCueTrigger({ formData, onChange, pillar }: StepCueTriggerProps) {
  const color = pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;

  const handleCueTypeChange = (type: CueType | null) => {
    onChange('cueType', type);
    if (!type) {
      onChange('cueValue', '');
    }
  };

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
