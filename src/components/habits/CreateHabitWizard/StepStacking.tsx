'use client';

import { Pillar } from '@prisma/client';
import type { SubCategory } from './types';
import { CreateHabitFormData, HabitStack, SUBCATEGORY_CONFIG, BODY_COLOR, MIND_COLOR } from './types';

interface StepStackingProps {
  formData: CreateHabitFormData;
  onChange: <K extends keyof CreateHabitFormData>(field: K, value: CreateHabitFormData[K]) => void;
  pillar: Pillar;
  stacks: HabitStack[];
  isLoadingStacks: boolean;
}

export function StepStacking({ formData, onChange, pillar, stacks, isLoadingStacks }: StepStackingProps) {
  const color = pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;
  const activeStacks = stacks.filter(s => s.isActive);

  const getActivityPillar = (activity: string): Pillar => {
    return ['TRAINING', 'SLEEP', 'NUTRITION'].includes(activity) ? 'BODY' : 'MIND';
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Add to a Stack?</h3>
        <p className="text-sm text-text-muted mt-1">
          Group habits together for a routine (optional)
        </p>
      </div>

      {/* Skip Option */}
      <button
        type="button"
        onClick={() => onChange('addToStackId', null)}
        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
        style={{
          backgroundColor: formData.addToStackId === null ? `${color}10` : 'transparent',
          borderColor: formData.addToStackId === null ? color : 'rgb(var(--surface-lighter))',
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-text-primary">Standalone habit</p>
          <p className="text-sm text-text-muted">Don&apos;t add to any stack</p>
        </div>
        {formData.addToStackId === null && (
          <svg className="w-5 h-5" fill={color} viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Loading State */}
      {isLoadingStacks && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-surface-light rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Active Stacks */}
      {!isLoadingStacks && activeStacks.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-secondary">Your active stacks</p>
          {activeStacks.map((stack) => {
            const isSelected = formData.addToStackId === stack.id;
            return (
              <button
                key={stack.id}
                type="button"
                onClick={() => onChange('addToStackId', stack.id)}
                className="w-full p-4 rounded-xl border-2 transition-all text-left"
                style={{
                  backgroundColor: isSelected ? `${color}10` : 'transparent',
                  borderColor: isSelected ? color : 'rgb(var(--surface-lighter))',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-text-primary">{stack.name}</p>
                  {isSelected && (
                    <svg className="w-5 h-5" fill={color} viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {stack.description && (
                  <p className="text-sm text-text-muted mb-3">{stack.description}</p>
                )}
                {/* Activity Chain */}
                <div className="flex items-center gap-1 flex-wrap">
                  {stack.activities.map((activity, index) => {
                    const activityPillar = getActivityPillar(activity);
                    const activityColor = activityPillar === 'BODY' ? BODY_COLOR : MIND_COLOR;
                    const config = SUBCATEGORY_CONFIG[activity as SubCategory];
                    return (
                      <div key={index} className="flex items-center gap-1">
                        <div
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                          style={{ backgroundColor: `${activityColor}20`, color: activityColor }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={config?.icon || ''} />
                          </svg>
                          {config?.label || activity}
                        </div>
                        {index < stack.activities.length - 1 && (
                          <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                  {/* Show where new habit will be added */}
                  {isSelected && (
                    <>
                      <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border-2 border-dashed"
                        style={{ borderColor: color, color }}
                      >
                        + {formData.name || 'New habit'}
                      </div>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* No Stacks Message */}
      {!isLoadingStacks && activeStacks.length === 0 && (
        <div className="text-center py-8">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <svg className="w-8 h-8" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-text-secondary mb-2">No active stacks yet</p>
          <p className="text-sm text-text-muted">
            Visit the Stacks page to create and activate habit stacks
          </p>
        </div>
      )}

      {/* Info Box */}
      <div
        className="p-4 rounded-xl border"
        style={{ backgroundColor: `${color}05`, borderColor: `${color}30` }}
      >
        <p className="text-sm" style={{ color }}>
          <strong>Stacks</strong> help you chain habits together.
          Complete them in sequence to build powerful routines.
        </p>
      </div>
    </div>
  );
}
