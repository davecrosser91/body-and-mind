'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Habit } from '@/types'

export type HabitCategory = 'FITNESS' | 'MINDFULNESS' | 'NUTRITION' | 'SLEEP' | 'LEARNING'
export type HabitFrequency = 'DAILY' | 'WEEKLY' | 'CUSTOM'

export interface CreateHabitFormData {
  name: string
  category: HabitCategory
  description?: string
  frequency: HabitFrequency
}

export interface CreateHabitModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (habit: Habit) => void
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.15,
    },
  },
}

const categoryOptions: { value: HabitCategory; label: string; habitanimal: string; color: string }[] = [
  { value: 'FITNESS', label: 'Fitness', habitanimal: 'Guiro the Gorilla', color: 'fitness' },
  { value: 'MINDFULNESS', label: 'Mindfulness', habitanimal: 'Zen the Turtle', color: 'mindfulness' },
  { value: 'NUTRITION', label: 'Nutrition', habitanimal: 'Greeny the Frog', color: 'nutrition' },
  { value: 'SLEEP', label: 'Sleep', habitanimal: 'Milo the Cat', color: 'sleep' },
  { value: 'LEARNING', label: 'Learning', habitanimal: 'Finn the Owl', color: 'learning' },
]

const frequencyOptions: { value: HabitFrequency; label: string; description: string }[] = [
  { value: 'DAILY', label: 'Daily', description: 'Every day' },
  { value: 'WEEKLY', label: 'Weekly', description: 'Once a week' },
  { value: 'CUSTOM', label: 'Custom', description: 'Set your own schedule' },
]

const categoryColorMap: Record<HabitCategory, { bg: string; text: string; border: string; ring: string }> = {
  FITNESS: { bg: 'bg-fitness-50', text: 'text-fitness-600', border: 'border-fitness-500', ring: 'ring-fitness-500' },
  MINDFULNESS: { bg: 'bg-mindfulness-50', text: 'text-mindfulness-600', border: 'border-mindfulness-500', ring: 'ring-mindfulness-500' },
  NUTRITION: { bg: 'bg-nutrition-50', text: 'text-nutrition-600', border: 'border-nutrition-500', ring: 'ring-nutrition-500' },
  SLEEP: { bg: 'bg-sleep-50', text: 'text-sleep-600', border: 'border-sleep-500', ring: 'ring-sleep-500' },
  LEARNING: { bg: 'bg-learning-50', text: 'text-learning-600', border: 'border-learning-500', ring: 'ring-learning-500' },
}

interface ValidationErrors {
  name?: string
  category?: string
}

export function CreateHabitModal({
  isOpen,
  onClose,
  onCreated,
}: CreateHabitModalProps) {
  const [formData, setFormData] = useState<CreateHabitFormData>({
    name: '',
    category: 'FITNESS',
    description: '',
    frequency: 'DAILY',
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        category: 'FITNESS',
        description: '',
        frequency: 'DAILY',
      })
      setErrors({})
      setSubmitError(null)
    }
  }, [isOpen])

  const selectedCategory = categoryOptions.find(c => c.value === formData.category)
  const colors = categoryColorMap[formData.category]

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)
    setSubmitError(null)

    try {
      // Call the API to create the habit
      const response = await fetch('/api/v1/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description?.trim() || null,
          frequency: formData.frequency.toLowerCase(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || errorData.message || 'Failed to create habit')
      }

      const data = await response.json()
      onCreated(data.habit)
      handleClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create habit')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (isLoading) return
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            variants={backdropVariants}
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            variants={modalVariants}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-habit-title"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2
                  id="create-habit-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Create New Habit
                </h2>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100 disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 space-y-5 overflow-y-auto flex-1">
                {/* Name Field */}
                <div>
                  <label htmlFor="habit-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Habit Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="habit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                      if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
                    }}
                    disabled={isLoading}
                    placeholder="e.g., Morning run, Read for 30 minutes"
                    className={`w-full px-3 py-2 border rounded-lg text-sm
                      focus:outline-none focus:ring-2 focus:border-transparent
                      disabled:bg-gray-50 disabled:cursor-not-allowed
                      placeholder:text-gray-400
                      ${errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-gray-400'}
                    `}
                  />
                  <AnimatePresence>
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1 text-sm text-red-500"
                      >
                        {errors.name}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Category Field */}
                <div>
                  <label htmlFor="habit-category" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category
                  </label>
                  <select
                    id="habit-category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as HabitCategory }))}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                      focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent
                      disabled:bg-gray-50 disabled:cursor-not-allowed
                      bg-white"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {/* Habitanimal indicator */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={formData.category}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className={`mt-2 px-3 py-2 rounded-lg ${colors.bg} border ${colors.border}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                          <span className={`text-xs font-medium ${colors.text}`}>
                            {selectedCategory?.habitanimal.charAt(0)}
                          </span>
                        </div>
                        <p className={`text-sm ${colors.text}`}>
                          This habit will benefit <span className="font-medium">{selectedCategory?.habitanimal}</span>
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Description Field */}
                <div>
                  <label htmlFor="habit-description" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="habit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    disabled={isLoading}
                    placeholder="Add any notes about this habit..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                      focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent
                      disabled:bg-gray-50 disabled:cursor-not-allowed
                      placeholder:text-gray-400 resize-none"
                  />
                </div>

                {/* Frequency Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Frequency
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {frequencyOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, frequency: option.value }))}
                        disabled={isLoading}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                          disabled:cursor-not-allowed
                          ${formData.frequency === option.value
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">
                    {frequencyOptions.find(f => f.value === formData.frequency)?.description}
                  </p>
                </div>

                {/* Submit Error */}
                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <p className="text-sm text-red-600">{submitError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white
                      border border-gray-200 rounded-lg hover:bg-gray-50
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900
                      rounded-lg hover:bg-gray-800
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors min-w-[100px]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        />
                        Creating...
                      </span>
                    ) : (
                      'Create Habit'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
