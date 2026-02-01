'use client';

import { motion } from 'framer-motion';
import { Pillar } from '@prisma/client';
import { BODY_COLOR, MIND_COLOR } from './types';

interface Step {
  label: string;
  optional?: boolean;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
  pillar: Pillar;
}

export function StepIndicator({ currentStep, steps, pillar }: StepIndicatorProps) {
  const accentColor = pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={step.label} className="flex items-center gap-2">
            <motion.div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive
                  ? accentColor
                  : isCompleted
                  ? `${accentColor}30`
                  : 'rgb(var(--surface-lighter))',
                color: isActive
                  ? 'rgb(var(--background))'
                  : isCompleted
                  ? accentColor
                  : 'rgb(var(--text-muted))',
              }}
              animate={{ scale: isActive ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {isCompleted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                stepNum
              )}
            </motion.div>
            {index < steps.length - 1 && (
              <div
                className="w-8 h-0.5 transition-colors"
                style={{
                  backgroundColor: isCompleted ? accentColor : 'rgb(var(--surface-lighter))',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
