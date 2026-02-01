'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pillar } from '@prisma/client';
import type { SubCategory } from './types';
import { useAuth } from '@/hooks/useAuth';
import { StepIndicator } from './StepIndicator';
import { StepBasicInfo } from './StepBasicInfo';
import { StepCueTrigger } from './StepCueTrigger';
import { StepStacking } from './StepStacking';
import {
  CreateHabitFormData,
  INITIAL_FORM_DATA,
  HabitStack,
  BODY_COLOR,
  MIND_COLOR,
} from './types';

interface CreateHabitWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (habit: {
    id: string;
    name: string;
    pillar: Pillar;
    subCategory: SubCategory;
    points: number;
  }) => void;
}

const STEPS = [
  { label: 'Basic Info' },
  { label: 'Trigger', optional: true },
  { label: 'Stack', optional: true },
];

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

export function CreateHabitWizard({ isOpen, onClose, onCreated }: CreateHabitWizardProps) {
  const { token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState<CreateHabitFormData>(INITIAL_FORM_DATA);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stacks, setStacks] = useState<HabitStack[]>([]);
  const [isLoadingStacks, setIsLoadingStacks] = useState(false);

  const color = formData.pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;

  // Handle SSR
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM_DATA);
      setCurrentStep(1);
      setDirection(0);
      setError(null);
    }
  }, [isOpen]);

  // Fetch stacks when entering step 3
  useEffect(() => {
    if (currentStep === 3 && token && stacks.length === 0) {
      fetchStacks();
    }
  }, [currentStep, token]);

  const fetchStacks = async () => {
    if (!token) return;
    setIsLoadingStacks(true);
    try {
      const response = await fetch('/api/v1/stacks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStacks(data.data?.stacks || []);
      }
    } catch (err) {
      console.error('Failed to fetch stacks:', err);
    } finally {
      setIsLoadingStacks(false);
    }
  };

  const handleChange = useCallback(<K extends keyof CreateHabitFormData>(
    field: K,
    value: CreateHabitFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setError('Habit name is required');
          return false;
        }
        return true;
      case 2:
        if (formData.cueType === 'TIME' && !formData.cueValue) {
          setError('Please select a time');
          return false;
        }
        if (
          (formData.cueType === 'LOCATION' || formData.cueType === 'AFTER_ACTIVITY') &&
          !formData.cueValue.trim()
        ) {
          setError('Please enter a value for the trigger');
          return false;
        }
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setDirection(1);
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!token) return;
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          pillar: formData.pillar,
          subCategory: formData.subCategory,
          frequency: formData.frequency,
          description: formData.description.trim() || null,
          points: formData.points,
          isHabit: true,
          cueType: formData.cueType,
          cueValue: formData.cueValue.trim() || null,
          ...(formData.autoTrigger && {
            autoTrigger: {
              triggerType: formData.autoTrigger.triggerType,
              thresholdValue: formData.autoTrigger.thresholdValue,
              workoutTypeId: formData.autoTrigger.workoutTypeId,
              triggerActivityId: formData.autoTrigger.triggerActivityId,
            },
          }),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to create activity');
      }

      const data = await response.json();
      const habit = data.data;

      // If adding to a stack, update the stack
      if (formData.addToStackId && habit) {
        const stack = stacks.find((s) => s.id === formData.addToStackId);
        if (stack) {
          await fetch(`/api/v1/stacks/${formData.addToStackId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              activities: [...stack.activities, formData.subCategory],
            }),
          });
        }
      }

      onCreated({
        id: habit.id,
        name: habit.name,
        pillar: habit.pillar,
        subCategory: habit.subCategory,
        points: habit.points,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create habit');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-surface-lighter overflow-hidden max-h-[90vh] flex flex-col"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div
              className="px-6 py-4 border-b border-surface-lighter flex items-center justify-between shrink-0"
              style={{ borderBottomColor: `${color}30` }}
            >
              <h2 className="text-lg font-semibold text-text-primary">Create Habit</h2>
              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-text-secondary rounded-lg hover:bg-surface-light transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 shrink-0">
              <StepIndicator currentStep={currentStep} steps={STEPS} pillar={formData.pillar} />
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 1 && (
                    <StepBasicInfo
                      formData={formData}
                      onChange={handleChange}
                      error={error}
                    />
                  )}
                  {currentStep === 2 && (
                    <StepCueTrigger
                      formData={formData}
                      onChange={handleChange}
                      pillar={formData.pillar}
                    />
                  )}
                  {currentStep === 3 && (
                    <StepStacking
                      formData={formData}
                      onChange={handleChange}
                      pillar={formData.pillar}
                      stacks={stacks}
                      isLoadingStacks={isLoadingStacks}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-surface-lighter flex gap-3 shrink-0">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 px-4 py-3 rounded-xl border border-surface-lighter
                    text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-surface-lighter
                    text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors"
                >
                  Cancel
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 px-4 py-3 rounded-xl font-medium transition-all"
                  style={{ backgroundColor: color, color: 'rgb(var(--background))' }}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl font-medium transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: color, color: 'rgb(var(--background))' }}
                >
                  {isLoading ? 'Creating...' : 'Create Habit'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
