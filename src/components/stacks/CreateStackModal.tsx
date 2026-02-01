'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { CueType } from '@prisma/client';
import { useActivitiesForStacks, ActivityInStack } from './useStacks';

const BODY_COLOR = '#E8A854';
const MIND_COLOR = '#5BCCB3';

const CUE_TYPE_CONFIG: Record<CueType, { label: string; icon: string; placeholder: string }> = {
  TIME: { label: 'At a time', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', placeholder: '07:00' },
  LOCATION: { label: 'At a location', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', placeholder: 'Home, Gym, Office' },
  AFTER_ACTIVITY: { label: 'After an activity', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', placeholder: 'After morning coffee' },
};

interface CreateStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (data: {
    name: string;
    description?: string;
    activityIds: string[];
    cueType?: CueType | null;
    cueValue?: string | null;
    completionBonus?: number;
  }) => void;
}

export function CreateStackModal({ isOpen, onClose, onCreated }: CreateStackModalProps) {
  const { activities, isLoading: isLoadingActivities } = useActivitiesForStacks();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [cueType, setCueType] = useState<CueType | null>(null);
  const [cueValue, setCueValue] = useState('');
  const [completionBonus, setCompletionBonus] = useState(20);
  const [error, setError] = useState<string | null>(null);

  const primaryColor = BODY_COLOR;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setName('');
      setDescription('');
      setSelectedActivityIds([]);
      setCueType(null);
      setCueValue('');
      setCompletionBonus(20);
      setError(null);
    }
  }, [isOpen]);

  const selectedActivities = selectedActivityIds
    .map(id => activities.find(a => a.id === id))
    .filter((a): a is ActivityInStack => a !== undefined);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError('Stack name is required');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedActivityIds.length < 2) {
        setError('Select at least 2 activities to create a stack');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = () => {
    onCreated({
      name: name.trim(),
      description: description.trim() || undefined,
      activityIds: selectedActivityIds,
      cueType: cueType || undefined,
      cueValue: cueValue.trim() || undefined,
      completionBonus,
    });
    onClose();
  };

  const toggleActivity = (activityId: string) => {
    setSelectedActivityIds(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      }
      return [...prev, activityId];
    });
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
            <div className="px-6 py-4 border-b border-surface-lighter flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-text-primary">Create Stack</h2>
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
            <div className="flex items-center justify-center gap-2 py-4 px-6 shrink-0">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: step === s ? primaryColor : step > s ? `${primaryColor}30` : 'rgb(var(--surface-lighter))',
                      color: step === s ? 'rgb(var(--background))' : step > s ? primaryColor : 'rgb(var(--text-muted))',
                    }}
                  >
                    {step > s ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s
                    )}
                  </div>
                  {s < 3 && (
                    <div
                      className="w-8 h-0.5 transition-colors"
                      style={{ backgroundColor: step > s ? primaryColor : 'rgb(var(--surface-lighter))' }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-text-primary">Name Your Stack</h3>
                      <p className="text-sm text-text-muted mt-1">Give your routine a memorable name</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Stack Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Morning Power Hour"
                        className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Description <span className="text-text-muted font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What's this stack for?"
                        rows={2}
                        className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Completion Bonus
                      </label>
                      <p className="text-xs text-text-muted mb-3">
                        Bonus points when you complete all activities in this stack
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="5"
                          value={completionBonus}
                          onChange={(e) => setCompletionBonus(parseInt(e.target.value))}
                          className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${completionBonus * 2}%, rgb(var(--surface-lighter)) ${completionBonus * 2}%, rgb(var(--surface-lighter)) 100%)`,
                          }}
                        />
                        <span className="w-16 text-right font-mono text-text-primary">+{completionBonus}%</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-text-primary">Select Activities</h3>
                      <p className="text-sm text-text-muted mt-1">Choose at least 2 activities and arrange them</p>
                    </div>

                    {isLoadingActivities ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-14 bg-surface-light rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : activities.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-light flex items-center justify-center">
                          <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-text-secondary mb-2">No activities yet</p>
                        <p className="text-sm text-text-muted">Create some activities first, then come back to build a stack</p>
                      </div>
                    ) : (
                      <>
                        {/* Activity Selection */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {activities.map((activity) => {
                            const isSelected = selectedActivityIds.includes(activity.id);
                            const color = activity.pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;

                            return (
                              <button
                                key={activity.id}
                                onClick={() => toggleActivity(activity.id)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
                                style={{
                                  backgroundColor: isSelected ? `${color}15` : 'transparent',
                                  borderColor: isSelected ? color : 'rgb(var(--surface-lighter))',
                                }}
                              >
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                                  style={{ backgroundColor: `${color}20`, color }}
                                >
                                  {activity.pillar === 'BODY' ? 'B' : 'M'}
                                </div>
                                <div className="flex-1">
                                  <span className={isSelected ? 'text-text-primary font-medium' : 'text-text-secondary'}>
                                    {activity.name}
                                  </span>
                                  <span className="text-xs text-text-muted ml-2">+{activity.points} pts</span>
                                </div>
                                {isSelected && (
                                  <svg className="w-5 h-5" fill={color} viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Reorder Preview */}
                        {selectedActivities.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-text-secondary mb-2">Order (drag to rearrange)</p>
                            <Reorder.Group axis="y" values={selectedActivityIds} onReorder={setSelectedActivityIds} className="space-y-2">
                              {selectedActivityIds.map((activityId) => {
                                const activity = activities.find(a => a.id === activityId);
                                if (!activity) return null;
                                const color = activity.pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;

                                return (
                                  <Reorder.Item
                                    key={activityId}
                                    value={activityId}
                                    className="flex items-center gap-3 p-3 bg-surface-light rounded-xl cursor-move"
                                  >
                                    <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                    </svg>
                                    <div
                                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                                      style={{ backgroundColor: `${color}20`, color }}
                                    >
                                      {activity.pillar === 'BODY' ? 'B' : 'M'}
                                    </div>
                                    <span className="text-text-primary">{activity.name}</span>
                                    <span className="text-xs text-text-muted ml-auto">+{activity.points}</span>
                                  </Reorder.Item>
                                );
                              })}
                            </Reorder.Group>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-text-primary">Set a Trigger</h3>
                      <p className="text-sm text-text-muted mt-1">When should you start this stack? (optional)</p>
                    </div>

                    {/* No Cue Option */}
                    <button
                      type="button"
                      onClick={() => { setCueType(null); setCueValue(''); }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                      style={{
                        backgroundColor: cueType === null ? `${primaryColor}10` : 'transparent',
                        borderColor: cueType === null ? primaryColor : 'rgb(var(--surface-lighter))',
                      }}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                        <svg className="w-6 h-6" fill="none" stroke={primaryColor} viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">No trigger</p>
                        <p className="text-sm text-text-muted">Start manually</p>
                      </div>
                      {cueType === null && (
                        <svg className="w-5 h-5" fill={primaryColor} viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {/* Cue Options */}
                    {(['TIME', 'LOCATION', 'AFTER_ACTIVITY'] as CueType[]).map((type) => {
                      const config = CUE_TYPE_CONFIG[type];
                      const isSelected = cueType === type;

                      return (
                        <div key={type}>
                          <button
                            type="button"
                            onClick={() => setCueType(type)}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                            style={{
                              backgroundColor: isSelected ? `${primaryColor}10` : 'transparent',
                              borderColor: isSelected ? primaryColor : 'rgb(var(--surface-lighter))',
                            }}
                          >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                              <svg className="w-6 h-6" fill="none" stroke={primaryColor} viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-text-primary">{config.label}</p>
                            </div>
                            {isSelected && (
                              <svg className="w-5 h-5" fill={primaryColor} viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>

                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3 ml-16"
                            >
                              {type === 'TIME' ? (
                                <input
                                  type="time"
                                  value={cueValue || '07:00'}
                                  onChange={(e) => setCueValue(e.target.value)}
                                  className="px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary text-lg font-mono focus:outline-none focus:ring-2 focus:border-transparent"
                                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={cueValue}
                                  onChange={(e) => setCueValue(e.target.value)}
                                  placeholder={config.placeholder}
                                  className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:border-transparent"
                                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                                />
                              )}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}

                    {/* Preview */}
                    <div className="mt-6 p-4 bg-surface-light rounded-xl">
                      <p className="text-sm font-medium text-text-secondary mb-3">Preview</p>
                      <p className="font-semibold text-text-primary mb-2">{name}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {selectedActivities.map((activity, index) => {
                          const color = activity.pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;
                          return (
                            <div key={activity.id} className="flex items-center gap-1.5">
                              <div
                                className="px-2 py-0.5 rounded-lg text-xs font-medium"
                                style={{ backgroundColor: `${color}20`, color }}
                              >
                                {activity.name}
                              </div>
                              {index < selectedActivities.length - 1 && (
                                <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {completionBonus > 0 && (
                        <p className="text-xs text-green-400 mt-2">+{completionBonus}% bonus on completion</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-400 mt-4"
                >
                  {error}
                </motion.p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-surface-lighter flex gap-3 shrink-0">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-4 py-3 rounded-xl border border-surface-lighter text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-surface-lighter text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors"
                >
                  Cancel
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={step === 2 && activities.length === 0}
                  className="flex-1 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor, color: 'rgb(var(--background))' }}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 rounded-xl font-medium transition-all"
                  style={{ backgroundColor: primaryColor, color: 'rgb(var(--background))' }}
                >
                  Create Stack
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
