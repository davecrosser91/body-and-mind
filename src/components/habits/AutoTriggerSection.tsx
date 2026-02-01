'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pillar, AutoTriggerType } from '@prisma/client'
import { useAuth } from '@/hooks/useAuth'

// Whoop workout types - common sport_ids from the Whoop API
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
  { id: 16, name: 'Basketball' },
  { id: 25, name: 'Golf' },
  { id: 57, name: 'Tennis' },
  { id: 64, name: 'Rowing' },
  { id: 73, name: 'Pilates' },
] as const

export interface AutoTriggerConfig {
  triggerType: AutoTriggerType
  thresholdValue?: number
  workoutTypeId?: number
  triggerActivityId?: string
}

interface AutoTriggerSectionProps {
  pillar: Pillar
  trigger?: AutoTriggerConfig | null
  onChange: (trigger: AutoTriggerConfig | null) => void
}

// Trigger type configuration
interface TriggerTypeConfig {
  type: AutoTriggerType
  label: string
  needsThreshold?: boolean
  needsWorkoutType?: boolean
  needsActivity?: boolean
  unit?: string
  defaultValue?: number
}

// Group trigger types by source
const TRIGGER_TYPE_GROUPS: Array<{ label: string; types: TriggerTypeConfig[] }> = [
  {
    label: 'Whoop Recovery',
    types: [
      { type: 'WHOOP_RECOVERY_ABOVE', label: 'Recovery above %', needsThreshold: true, unit: '%', defaultValue: 60 },
      { type: 'WHOOP_RECOVERY_BELOW', label: 'Recovery below %', needsThreshold: true, unit: '%', defaultValue: 50 },
    ],
  },
  {
    label: 'Whoop Sleep',
    types: [
      { type: 'WHOOP_SLEEP_ABOVE', label: 'Sleep more than hours', needsThreshold: true, unit: 'hours', defaultValue: 7 },
    ],
  },
  {
    label: 'Whoop Workout',
    types: [
      { type: 'WHOOP_STRAIN_ABOVE', label: 'Strain above', needsThreshold: true, unit: 'strain', defaultValue: 10 },
      { type: 'WHOOP_WORKOUT_TYPE', label: 'Workout type logged', needsWorkoutType: true },
    ],
  },
  {
    label: 'Activity',
    types: [
      { type: 'ACTIVITY_COMPLETED', label: 'When activity completed', needsActivity: true },
    ],
  },
]

// Flatten for lookup
const ALL_TRIGGER_CONFIGS: TriggerTypeConfig[] = TRIGGER_TYPE_GROUPS.flatMap((g) => g.types)

interface Activity {
  id: string
  name: string
  pillar: string
}

export function AutoTriggerSection({
  pillar,
  trigger,
  onChange,
}: AutoTriggerSectionProps) {
  const { token } = useAuth()
  const [isExpanded, setIsExpanded] = useState(!!trigger)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  const pillarColor = pillar === 'BODY' ? '#E8A854' : '#5BCCB3'

  // Fetch user activities for ACTIVITY_COMPLETED trigger
  useEffect(() => {
    if (isExpanded && token) {
      setLoadingActivities(true)
      fetch('/api/v1/activities', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setActivities(data)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingActivities(false))
    }
  }, [isExpanded, token])

  const handleToggle = () => {
    if (isExpanded) {
      // Collapse and clear trigger
      setIsExpanded(false)
      onChange(null)
    } else {
      setIsExpanded(true)
    }
  }

  const handleTypeChange = (triggerType: AutoTriggerType) => {
    const config = ALL_TRIGGER_CONFIGS.find((c) => c.type === triggerType)
    if (!config) return

    const newTrigger: AutoTriggerConfig = {
      triggerType,
      thresholdValue: config.needsThreshold ? config.defaultValue : undefined,
      workoutTypeId: config.needsWorkoutType ? WHOOP_WORKOUT_TYPES[0].id : undefined,
      triggerActivityId: config.needsActivity ? undefined : undefined,
    }
    onChange(newTrigger)
  }

  const handleThresholdChange = (value: number) => {
    if (!trigger) return
    onChange({ ...trigger, thresholdValue: value })
  }

  const handleWorkoutTypeChange = (workoutTypeId: number) => {
    if (!trigger) return
    onChange({ ...trigger, workoutTypeId })
  }

  const handleActivityChange = (activityId: string) => {
    if (!trigger) return
    onChange({ ...trigger, triggerActivityId: activityId })
  }

  const currentConfig = trigger
    ? ALL_TRIGGER_CONFIGS.find((c) => c.type === trigger.triggerType)
    : null

  return (
    <div className="space-y-3">
      {/* Toggle header */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center justify-between w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-left transition-colors hover:bg-surface-lighter"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke={isExpanded ? pillarColor : 'currentColor'}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className={`text-sm font-medium ${isExpanded ? '' : 'text-text-secondary'}`}>
            Auto-Trigger
          </span>
          <span className="text-xs text-text-muted">(optional)</span>
        </div>
        <motion.svg
          className="w-5 h-5 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-2">
              {/* Trigger type selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Trigger When
                </label>
                <select
                  value={trigger?.triggerType || ''}
                  onChange={(e) => handleTypeChange(e.target.value as AutoTriggerType)}
                  className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                    text-text-primary
                    focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': pillarColor } as React.CSSProperties}
                >
                  <option value="">Select a trigger...</option>
                  {TRIGGER_TYPE_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.types.map((config) => (
                        <option key={config.type} value={config.type}>
                          {config.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Threshold input */}
              {currentConfig?.needsThreshold && trigger && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Threshold ({currentConfig.unit})
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={trigger.thresholdValue ?? ''}
                      onChange={(e) => handleThresholdChange(parseFloat(e.target.value) || 0)}
                      min={0}
                      max={currentConfig.unit === '%' ? 100 : currentConfig.unit === 'strain' ? 21 : 24}
                      step={currentConfig.unit === 'hours' ? 0.5 : 1}
                      className="flex-1 px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                        text-text-primary
                        focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': pillarColor } as React.CSSProperties}
                    />
                    <span className="text-text-muted text-sm min-w-[50px]">
                      {currentConfig.unit}
                    </span>
                  </div>
                  {/* Helper text */}
                  <p className="text-xs text-text-muted mt-1">
                    {trigger.triggerType === 'WHOOP_RECOVERY_ABOVE' &&
                      'This habit will auto-complete when your Whoop recovery is at or above this percentage'}
                    {trigger.triggerType === 'WHOOP_RECOVERY_BELOW' &&
                      'This habit will auto-complete when your Whoop recovery is below this percentage'}
                    {trigger.triggerType === 'WHOOP_SLEEP_ABOVE' &&
                      'This habit will auto-complete when your Whoop sleep is at or above this many hours'}
                    {trigger.triggerType === 'WHOOP_STRAIN_ABOVE' &&
                      'This habit will auto-complete when your Whoop strain reaches this level'}
                  </p>
                </motion.div>
              )}

              {/* Workout type selection */}
              {currentConfig?.needsWorkoutType && trigger && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Workout Type
                  </label>
                  <select
                    value={trigger.workoutTypeId ?? ''}
                    onChange={(e) => handleWorkoutTypeChange(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                      text-text-primary
                      focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': pillarColor } as React.CSSProperties}
                  >
                    {WHOOP_WORKOUT_TYPES.map((workout) => (
                      <option key={workout.id} value={workout.id}>
                        {workout.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-text-muted mt-1">
                    This habit will auto-complete when this workout type is logged in Whoop
                  </p>
                </motion.div>
              )}

              {/* Activity selection */}
              {currentConfig?.needsActivity && trigger && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Trigger Activity
                  </label>
                  <select
                    value={trigger.triggerActivityId ?? ''}
                    onChange={(e) => handleActivityChange(e.target.value)}
                    disabled={loadingActivities}
                    className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl
                      text-text-primary
                      focus:outline-none focus:ring-2 focus:border-transparent
                      disabled:opacity-50"
                    style={{ '--tw-ring-color': pillarColor } as React.CSSProperties}
                  >
                    <option value="">Select an activity...</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.name} ({activity.pillar})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-text-muted mt-1">
                    This habit will auto-complete when the selected activity is completed
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
