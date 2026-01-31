'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Habit } from '@/types'
import { HabitanimalIcon, type HabitanimalSpecies } from '@/components/habitanimals/icons'

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

// Category info with habitanimal details
const CATEGORY_INFO: Record<HabitCategory, {
  label: string
  habitanimal: string
  species: HabitanimalSpecies
  description: string
}> = {
  FITNESS: { label: 'Fitness', habitanimal: 'Guiro', species: 'guiro', description: 'Exercise & movement' },
  MINDFULNESS: { label: 'Mindfulness', habitanimal: 'Zen', species: 'zen', description: 'Meditation & calm' },
  NUTRITION: { label: 'Nutrition', habitanimal: 'Greeny', species: 'greeny', description: 'Healthy eating' },
  SLEEP: { label: 'Sleep', habitanimal: 'Milo', species: 'milo', description: 'Rest & recovery' },
  LEARNING: { label: 'Learning', habitanimal: 'Finn', species: 'finn', description: 'Knowledge & growth' },
}

const categoryOptions = Object.entries(CATEGORY_INFO).map(([value, info]) => ({
  value: value as HabitCategory,
  ...info,
}))

const frequencyOptions: { value: HabitFrequency; label: string; description: string }[] = [
  { value: 'DAILY', label: 'Daily', description: 'Every day' },
  { value: 'WEEKLY', label: 'Weekly', description: 'Once a week' },
  { value: 'CUSTOM', label: 'Custom', description: 'Set your own schedule' },
]

const categoryColorMap: Record<HabitCategory, { bg: string; bgHover: string; text: string; border: string; borderSelected: string; ring: string }> = {
  FITNESS: { bg: 'bg-fitness-50', bgHover: 'hover:bg-fitness-100', text: 'text-fitness-600', border: 'border-fitness-200', borderSelected: 'border-fitness-500', ring: 'ring-fitness-500' },
  MINDFULNESS: { bg: 'bg-mindfulness-50', bgHover: 'hover:bg-mindfulness-100', text: 'text-mindfulness-600', border: 'border-mindfulness-200', borderSelected: 'border-mindfulness-500', ring: 'ring-mindfulness-500' },
  NUTRITION: { bg: 'bg-nutrition-50', bgHover: 'hover:bg-nutrition-100', text: 'text-nutrition-600', border: 'border-nutrition-200', borderSelected: 'border-nutrition-500', ring: 'ring-nutrition-500' },
  SLEEP: { bg: 'bg-sleep-50', bgHover: 'hover:bg-sleep-100', text: 'text-sleep-600', border: 'border-sleep-200', borderSelected: 'border-sleep-500', ring: 'ring-sleep-500' },
  LEARNING: { bg: 'bg-learning-50', bgHover: 'hover:bg-learning-100', text: 'text-learning-600', border: 'border-learning-200', borderSelected: 'border-learning-500', ring: 'ring-learning-500' },
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

  const selectedCategoryInfo = CATEGORY_INFO[formData.category]
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
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100 disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
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

                {/* Category Field - Visual Cards */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {categoryOptions.map((option) => {
                      const optionColors = categoryColorMap[option.value]
                      const isSelected = formData.category === option.value
                      return (
                        <motion.button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, category: option.value }))}
                          disabled={isLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative p-3 rounded-lg border-2 text-left transition-all min-h-[80px]
                            focus:outline-none focus:ring-2 focus:ring-offset-1 ${optionColors.ring}
                            disabled:cursor-not-allowed disabled:opacity-50
                            ${isSelected
                              ? `${optionColors.bg} ${optionColors.borderSelected}`
                              : `bg-white ${optionColors.border} ${optionColors.bgHover}`
                            }
                          `}
                        >
                          {/* Selected indicator */}
                          {isSelected && (
                            <motion.div
                              layoutId="category-selected"
                              className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full ${optionColors.text} bg-current flex items-center justify-center`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </motion.div>
                          )}

                          {/* Habitanimal Icon */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <HabitanimalIcon
                              species={option.species}
                              mood="happy"
                              size={28}
                            />
                            <span className={`text-xs font-semibold ${optionColors.text}`}>
                              {option.habitanimal}
                            </span>
                          </div>

                          {/* Category name */}
                          <p className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                            {option.label}
                          </p>

                          {/* Description */}
                          <p className="text-xs text-gray-500 mt-0.5">
                            {option.description}
                          </p>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* XP benefit indicator */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={formData.category}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className={`mt-3 px-3 py-2 rounded-lg ${colors.bg} border ${colors.borderSelected}`}
                    >
                      <div className="flex items-center gap-2">
                        <HabitanimalIcon
                          species={selectedCategoryInfo.species}
                          mood="happy"
                          size={24}
                        />
                        <p className={`text-sm ${colors.text}`}>
                          XP will go to <span className="font-semibold">{selectedCategoryInfo.habitanimal}</span>
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
                        className={`px-3 py-3 rounded-lg border text-sm font-medium transition-all min-h-[44px]
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
              <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-3 text-sm font-medium text-gray-700 bg-white
                      border border-gray-200 rounded-lg hover:bg-gray-50
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-3 text-sm font-medium text-white bg-gray-900
                      rounded-lg hover:bg-gray-800
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors min-w-[100px] min-h-[44px]"
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
