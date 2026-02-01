'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';

interface TrainingTemplate {
  id: string;
  name: string;
  points: number;
  description?: string | null;
  usageCount: number;
  trainingDefaults?: {
    workoutType?: string;
    durationMinutes?: number;
    intensity?: string;
    muscleGroups?: string[];
    location?: string;
  } | null;
}

interface TemplateManagerProps {
  onClose?: () => void;
  embedded?: boolean;
}

const BODY_COLOR = '#E8A854';

const WORKOUT_TYPES: Record<string, { label: string; emoji: string }> = {
  STRENGTH: { label: 'Strength', emoji: '🏋️' },
  CARDIO: { label: 'Cardio', emoji: '🏃' },
  HIIT: { label: 'HIIT', emoji: '⚡' },
  YOGA: { label: 'Yoga', emoji: '🧘' },
  SPORTS: { label: 'Sports', emoji: '🏀' },
  WALK: { label: 'Walk', emoji: '🚶' },
  STRETCH: { label: 'Stretch', emoji: '🤸' },
  OTHER: { label: 'Other', emoji: '💪' },
};

const INTENSITIES: Record<string, string> = {
  LIGHT: 'Light',
  MODERATE: 'Moderate',
  HARD: 'Hard',
  MAX: 'Max',
};

const LOCATIONS: Record<string, string> = {
  GYM: 'Gym',
  HOME: 'Home',
  OUTDOOR: 'Outdoor',
  OTHER: 'Other',
};

export function TemplateManager({ onClose, embedded = false }: TemplateManagerProps) {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<TrainingTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTemplates = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/training/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [notification]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/training/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        setNotification({ type: 'success', message: 'Template deleted' });
      } else {
        setNotification({ type: 'error', message: 'Failed to delete template' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to delete template' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = async (template: TrainingTemplate) => {
    try {
      const res = await fetch(`/api/v1/training/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: template.name,
          points: template.points,
          description: template.description,
          trainingDefaults: template.trainingDefaults,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates((prev) => prev.map((t) => (t.id === template.id ? data.data : t)));
        setNotification({ type: 'success', message: 'Template updated' });
        setEditingTemplate(null);
      } else {
        setNotification({ type: 'error', message: 'Failed to update template' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to update template' });
    }
  };

  const content = (
    <div className={embedded ? '' : 'p-6'}>
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">Training Templates</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-secondary rounded-lg hover:bg-surface-light transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 px-4 py-3 rounded-lg ${
              notification.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8 text-text-muted">Loading templates...</div>
      )}

      {/* Empty State */}
      {!isLoading && templates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-text-muted mb-2">No training templates yet</p>
          <p className="text-sm text-text-muted">
            Templates are created when you log a workout with &quot;Save as template&quot; enabled
          </p>
        </div>
      )}

      {/* Templates List */}
      {!isLoading && templates.length > 0 && (
        <div className="space-y-3">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              layout
              className="bg-surface-light rounded-xl p-4 border border-surface-lighter"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const workoutType = template.trainingDefaults?.workoutType;
                      return workoutType && WORKOUT_TYPES[workoutType] ? (
                        <span className="text-lg">
                          {WORKOUT_TYPES[workoutType].emoji}
                        </span>
                      ) : null;
                    })()}
                    <h3 className="font-medium text-text-primary">{template.name}</h3>
                    <span className="text-sm text-amber-500">{template.points} pts</span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {template.trainingDefaults?.workoutType && (
                      <span className="px-2 py-0.5 rounded-full bg-surface text-xs text-text-muted">
                        {WORKOUT_TYPES[template.trainingDefaults.workoutType]?.label || template.trainingDefaults.workoutType}
                      </span>
                    )}
                    {template.trainingDefaults?.durationMinutes && (
                      <span className="px-2 py-0.5 rounded-full bg-surface text-xs text-text-muted">
                        {template.trainingDefaults.durationMinutes} min
                      </span>
                    )}
                    {template.trainingDefaults?.intensity && (
                      <span className="px-2 py-0.5 rounded-full bg-surface text-xs text-text-muted">
                        {INTENSITIES[template.trainingDefaults.intensity] || template.trainingDefaults.intensity}
                      </span>
                    )}
                    {template.trainingDefaults?.location && (
                      <span className="px-2 py-0.5 rounded-full bg-surface text-xs text-text-muted">
                        {LOCATIONS[template.trainingDefaults.location] || template.trainingDefaults.location}
                      </span>
                    )}
                    {template.trainingDefaults?.muscleGroups && template.trainingDefaults.muscleGroups.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-surface text-xs text-text-muted">
                        {template.trainingDefaults.muscleGroups.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Usage count */}
                  <p className="text-xs text-text-muted mt-2">
                    Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface transition-colors"
                    title="Edit template"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  {deletingId === template.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Confirm delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface transition-colors"
                        title="Cancel"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(template.id)}
                      className="p-2 text-text-muted hover:text-red-400 rounded-lg hover:bg-surface transition-colors"
                      title="Delete template"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingTemplate && mounted && createPortal(
        <EditTemplateModal
          template={editingTemplate}
          onSave={handleSaveEdit}
          onClose={() => setEditingTemplate(null)}
        />,
        document.body
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="bg-surface rounded-2xl shadow-xl border border-surface-lighter overflow-hidden">
      {content}
    </div>
  );
}

// Edit Modal Component
interface EditTemplateModalProps {
  template: TrainingTemplate;
  onSave: (template: TrainingTemplate) => void;
  onClose: () => void;
}

function EditTemplateModal({ template, onSave, onClose }: EditTemplateModalProps) {
  const [name, setName] = useState(template.name);
  const [points, setPoints] = useState(template.points);
  const [workoutType, setWorkoutType] = useState(template.trainingDefaults?.workoutType || '');
  const [durationMinutes, setDurationMinutes] = useState(template.trainingDefaults?.durationMinutes?.toString() || '');
  const [intensity, setIntensity] = useState(template.trainingDefaults?.intensity || '');
  const [location, setLocation] = useState(template.trainingDefaults?.location || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    await onSave({
      ...template,
      name: name.trim(),
      points,
      trainingDefaults: {
        ...template.trainingDefaults,
        workoutType: workoutType || undefined,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        intensity: intensity || undefined,
        location: location || undefined,
      },
    });
    setIsSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-surface-lighter overflow-hidden"
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-surface-lighter">
            <h3 className="text-lg font-semibold text-text-primary">Edit Template</h3>
          </div>

          <div className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
              />
            </div>

            {/* Points */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Points</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                min={1}
                max={100}
                className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
              />
            </div>

            {/* Workout Type */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Workout Type</label>
              <select
                value={workoutType}
                onChange={(e) => setWorkoutType(e.target.value)}
                className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary focus:outline-none focus:ring-2 appearance-none"
                style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
              >
                <option value="">Select...</option>
                {Object.entries(WORKOUT_TYPES).map(([value, { label, emoji }]) => (
                  <option key={value} value={value}>{emoji} {label}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="45"
                className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
              />
            </div>

            {/* Intensity */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Intensity</label>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary focus:outline-none focus:ring-2 appearance-none"
                style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
              >
                <option value="">Select...</option>
                {Object.entries(INTENSITIES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-text-primary focus:outline-none focus:ring-2 appearance-none"
                style={{ '--tw-ring-color': BODY_COLOR } as React.CSSProperties}
              >
                <option value="">Select...</option>
                {Object.entries(LOCATIONS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-surface-lighter flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-surface-lighter text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-background transition-all disabled:opacity-50"
              style={{ backgroundColor: BODY_COLOR }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
