'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface HabitDetailModalProps {
  isOpen: boolean
  onClose: () => void
  habit: { id: string; name: string; category: string }
  onComplete: (details?: string) => Promise<void>
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

type CategoryType = 'FITNESS' | 'MINDFULNESS' | 'NUTRITION' | 'SLEEP' | 'LEARNING'

const categoryColors: Record<CategoryType, { bg: string; text: string; border: string }> = {
  FITNESS: { bg: 'bg-fitness-50', text: 'text-fitness-600', border: 'border-fitness-500' },
  MINDFULNESS: { bg: 'bg-mindfulness-50', text: 'text-mindfulness-600', border: 'border-mindfulness-500' },
  NUTRITION: { bg: 'bg-nutrition-50', text: 'text-nutrition-600', border: 'border-nutrition-500' },
  SLEEP: { bg: 'bg-sleep-50', text: 'text-sleep-600', border: 'border-sleep-500' },
  LEARNING: { bg: 'bg-learning-50', text: 'text-learning-600', border: 'border-learning-500' },
}

const categoryPlaceholders: Record<CategoryType, string> = {
  FITNESS: 'e.g., 45 minutes, 3 sets of 12 reps',
  MINDFULNESS: 'e.g., 20 minutes meditation, gratitude journaling',
  NUTRITION: 'e.g., 2L water, balanced meal prep',
  SLEEP: 'e.g., 8 hours, no screens after 10pm',
  LEARNING: 'e.g., 1 chapter, 30 minutes practice',
}

export function HabitDetailModal({
  isOpen,
  onClose,
  habit,
  onComplete,
}: HabitDetailModalProps) {
  const [details, setDetails] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const category = habit.category as CategoryType
  const colors = categoryColors[category] || categoryColors.FITNESS
  const placeholder = categoryPlaceholders[category] || 'Add any notes or details...'

  const handleQuickComplete = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await onComplete()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete habit')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteWithDetails = async () => {
    if (!details.trim()) {
      setError('Please add some details or use Quick Complete')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await onComplete(details.trim())
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete habit')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (isLoading) return
    setDetails('')
    setError(null)
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
            className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"
            variants={modalVariants}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className={`px-6 py-4 ${colors.bg} border-b ${colors.border}`}>
              <div className="flex items-center justify-between">
                <h2
                  id="modal-title"
                  className={`text-lg font-semibold ${colors.text}`}
                >
                  Complete Habit
                </h2>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-white/50 disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-600">{habit.name}</p>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              {/* Details textarea */}
              <div className="mb-4">
                <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">
                  Details (optional)
                </label>
                <textarea
                  id="details"
                  value={details}
                  onChange={(e) => {
                    setDetails(e.target.value)
                    setError(null)
                  }}
                  placeholder={placeholder}
                  disabled={isLoading}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent
                    disabled:bg-gray-50 disabled:cursor-not-allowed
                    placeholder:text-gray-400 resize-none"
                />
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-sm text-red-600">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-3 text-sm font-medium text-gray-700 bg-white
                    border border-gray-200 rounded-lg hover:bg-gray-50
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors order-3 sm:order-1 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickComplete}
                  disabled={isLoading}
                  className="px-4 py-3 text-sm font-medium text-gray-700 bg-white
                    border border-gray-200 rounded-lg hover:bg-gray-50
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors order-2 min-h-[44px]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                      Completing...
                    </span>
                  ) : (
                    'Quick Complete'
                  )}
                </button>
                <button
                  onClick={handleCompleteWithDetails}
                  disabled={isLoading}
                  className={`px-4 py-3 text-sm font-medium text-white
                    rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors order-1 sm:order-3 min-h-[44px]
                    ${category === 'FITNESS' ? 'bg-fitness-500 hover:bg-fitness-600 focus:ring-fitness-500' : ''}
                    ${category === 'MINDFULNESS' ? 'bg-mindfulness-500 hover:bg-mindfulness-600 focus:ring-mindfulness-500' : ''}
                    ${category === 'NUTRITION' ? 'bg-nutrition-500 hover:bg-nutrition-600 focus:ring-nutrition-500' : ''}
                    ${category === 'SLEEP' ? 'bg-sleep-500 hover:bg-sleep-600 focus:ring-sleep-500' : ''}
                    ${category === 'LEARNING' ? 'bg-learning-500 hover:bg-learning-600 focus:ring-learning-500' : ''}
                  `}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                      Completing...
                    </span>
                  ) : (
                    'Complete with Details'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
