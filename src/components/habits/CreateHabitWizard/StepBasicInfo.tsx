'use client';

import { motion } from 'framer-motion';
import { Pillar, Frequency } from '@prisma/client';
import type { SubCategory } from './types';
import {
  CreateHabitFormData,
  BODY_SUBCATEGORIES,
  MIND_SUBCATEGORIES,
  SUBCATEGORY_CONFIG,
  POINTS_PRESETS,
  BODY_COLOR,
  MIND_COLOR,
} from './types';

interface StepBasicInfoProps {
  formData: CreateHabitFormData;
  onChange: <K extends keyof CreateHabitFormData>(field: K, value: CreateHabitFormData[K]) => void;
  error: string | null;
}

export function StepBasicInfo({ formData, onChange, error }: StepBasicInfoProps) {
  const color = formData.pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;
  const subCategories = formData.pillar === 'BODY' ? BODY_SUBCATEGORIES : MIND_SUBCATEGORIES;

  // When pillar changes, reset subCategory to first valid option
  const handlePillarChange = (pillar: Pillar) => {
    onChange('pillar', pillar);
    const newSubCategories = pillar === 'BODY' ? BODY_SUBCATEGORIES : MIND_SUBCATEGORIES;
    if (!newSubCategories.includes(formData.subCategory) && newSubCategories.length > 0) {
      const firstSubCategory = newSubCategories[0];
      if (firstSubCategory) {
        onChange('subCategory', firstSubCategory);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Habit Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g., Morning workout, Read 20 pages"
          className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
            text-text-primary placeholder-text-muted
            focus:outline-none focus:ring-2 focus:border-transparent transition-all"
          style={{ '--tw-ring-color': color } as React.CSSProperties}
        />
      </div>

      {/* Pillar */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Pillar
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['BODY', 'MIND'] as Pillar[]).map((pillar) => {
            const isSelected = formData.pillar === pillar;
            const pillarColor = pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;
            return (
              <button
                key={pillar}
                type="button"
                onClick={() => handlePillarChange(pillar)}
                className="px-4 py-3 rounded-xl border-2 font-medium transition-all"
                style={{
                  backgroundColor: isSelected ? `${pillarColor}20` : 'transparent',
                  borderColor: isSelected ? pillarColor : 'rgb(var(--surface-lighter))',
                  color: isSelected ? pillarColor : 'rgb(var(--text-secondary))',
                }}
              >
                {pillar === 'BODY' ? 'Body' : 'Mind'}
              </button>
            );
          })}
        </div>
      </div>

      {/* SubCategory */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {subCategories.map((cat) => {
            const config = SUBCATEGORY_CONFIG[cat];
            const isSelected = formData.subCategory === cat;
            if (!config) return null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onChange('subCategory', cat)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all"
                style={{
                  backgroundColor: isSelected ? `${color}20` : 'transparent',
                  borderColor: isSelected ? color : 'rgb(var(--surface-lighter))',
                  color: isSelected ? color : 'rgb(var(--text-secondary))',
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                </svg>
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Points */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Points <span className="text-text-muted font-normal">(daily goal: 100 per pillar)</span>
        </label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {POINTS_PRESETS.map((preset) => {
            const isSelected = formData.points === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => onChange('points', preset.value)}
                className="flex flex-col items-center p-3 rounded-xl border transition-all"
                style={{
                  backgroundColor: isSelected ? `${color}20` : 'transparent',
                  borderColor: isSelected ? color : 'rgb(var(--surface-lighter))',
                }}
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: isSelected ? color : 'rgb(var(--text-primary))' }}
                >
                  {preset.value}
                </span>
                <span className="text-xs text-text-muted">{preset.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={formData.points}
            onChange={(e) => onChange('points', parseInt(e.target.value))}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${color} 0%, ${color} ${formData.points}%, rgb(var(--surface-lighter)) ${formData.points}%, rgb(var(--surface-lighter)) 100%)`,
            }}
          />
          <span className="w-12 text-right font-mono text-text-primary">{formData.points}</span>
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Frequency
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['DAILY', 'WEEKLY', 'CUSTOM'] as Frequency[]).map((freq) => {
            const isSelected = formData.frequency === freq;
            const labels: Record<Frequency, string> = {
              DAILY: 'Daily',
              WEEKLY: 'Weekly',
              CUSTOM: 'Custom',
            };
            return (
              <button
                key={freq}
                type="button"
                onClick={() => onChange('frequency', freq)}
                className="px-4 py-2 rounded-xl border transition-all"
                style={{
                  backgroundColor: isSelected ? `${color}20` : 'transparent',
                  borderColor: isSelected ? color : 'rgb(var(--surface-lighter))',
                  color: isSelected ? color : 'rgb(var(--text-secondary))',
                }}
              >
                {labels[freq]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Description <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Add notes about this habit..."
          rows={2}
          className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
            text-text-primary placeholder-text-muted resize-none
            focus:outline-none focus:ring-2 focus:border-transparent transition-all"
          style={{ '--tw-ring-color': color } as React.CSSProperties}
        />
      </div>

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
    </div>
  );
}
