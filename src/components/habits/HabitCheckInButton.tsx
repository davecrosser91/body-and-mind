'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface HabitCheckInButtonProps {
  habitId: string
  habitName: string
  isCompleted: boolean
  isLoading?: boolean
  onComplete: (habitId: string, details?: string) => Promise<void>
  onUncomplete: (habitId: string) => Promise<void>
  onOpenDetailModal?: () => void
}

export function HabitCheckInButton({
  habitId,
  habitName,
  isCompleted,
  isLoading = false,
  onComplete,
  onUncomplete,
  onOpenDetailModal,
}: HabitCheckInButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const loading = isLoading || isProcessing

  const handleClick = async () => {
    if (loading) return

    if (isCompleted) {
      // Uncomplete the habit
      setIsProcessing(true)
      try {
        await onUncomplete(habitId)
      } finally {
        setIsProcessing(false)
      }
    } else {
      // If detail modal opener is provided, use it
      if (onOpenDetailModal) {
        onOpenDetailModal()
      } else {
        // Quick complete without details
        setIsProcessing(true)
        try {
          await onComplete(habitId)
          // Show success animation
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 1000)
        } finally {
          setIsProcessing(false)
        }
      }
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={loading}
      className={`
        relative w-11 h-11 rounded-full flex items-center justify-center
        flex-shrink-0 transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
        disabled:cursor-not-allowed disabled:opacity-50
        -m-2
      `}
      whileHover={!loading ? { scale: 1.05 } : undefined}
      whileTap={!loading ? { scale: 0.95 } : undefined}
      aria-label={isCompleted ? `Mark ${habitName} as incomplete` : `Mark ${habitName} as complete`}
    >
      {/* Visual checkbox circle */}
      <div
        className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center
          transition-colors duration-200
          ${
            isCompleted
              ? 'border-green-500 bg-green-500'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }
        `}
      >
        {/* Loading spinner */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center"
            >
              <motion.div
                className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          )}

          {/* Checkmark for completed state */}
          {!loading && isCompleted && (
            <motion.svg
              key="checkmark"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-3.5 h-3.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
          )}

          {/* Empty circle for uncompleted state */}
          {!loading && !isCompleted && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Success burst animation */}
      <AnimatePresence>
        {showSuccess && (
          <>
            {/* Expanding ring */}
            <motion.div
              key="ring"
              className="absolute inset-0 rounded-full border-2 border-green-400"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            {/* Particle burst */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1.5 h-1.5 bg-green-400 rounded-full"
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * 60 * Math.PI) / 180) * 20,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 20,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
