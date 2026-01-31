'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Confetti } from '../ui/Confetti'

export interface LevelUpCelebrationProps {
  /**
   * Whether to show the celebration modal
   */
  show: boolean
  /**
   * Name of the habitanimal that leveled up
   */
  habitanimalName: string
  /**
   * The new level reached
   */
  newLevel: number
  /**
   * Whether the habitanimal also evolved
   */
  evolved?: boolean
  /**
   * Name of the new evolution stage (e.g., "Teen", "Adult", "Legendary")
   */
  newEvolutionStage?: string
  /**
   * Callback to close the celebration
   */
  onClose: () => void
  /**
   * Auto-close after specified seconds (0 to disable)
   * @default 5
   */
  autoCloseDelay?: number
}

// Sound effect placeholder - can be implemented with Web Audio API or audio files
const playCelebrationSound = () => {
  // Placeholder for sound effect implementation
  // Could use: new Audio('/sounds/level-up.mp3').play()
  // or Web Audio API for generated sounds
  console.log('[Sound] Level up celebration sound would play here')
}

const playEvolutionSound = () => {
  // Placeholder for evolution sound effect
  console.log('[Sound] Evolution celebration sound would play here')
}

/**
 * Level-up Celebration Component
 *
 * A full-screen overlay that celebrates when a habitanimal levels up.
 * Shows extra fanfare when the habitanimal evolves to a new stage.
 *
 * @example
 * ```tsx
 * <LevelUpCelebration
 *   show={showCelebration}
 *   habitanimalName="Guiro"
 *   newLevel={10}
 *   evolved={true}
 *   newEvolutionStage="Teen"
 *   onClose={() => setShowCelebration(false)}
 * />
 * ```
 */
export function LevelUpCelebration({
  show,
  habitanimalName,
  newLevel,
  evolved = false,
  newEvolutionStage,
  onClose,
  autoCloseDelay = 5,
}: LevelUpCelebrationProps) {
  // Handle auto-close
  useEffect(() => {
    if (show && autoCloseDelay > 0) {
      const timer = setTimeout(onClose, autoCloseDelay * 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [show, autoCloseDelay, onClose])

  // Play sound effects
  useEffect(() => {
    if (show) {
      if (evolved) {
        playEvolutionSound()
      } else {
        playCelebrationSound()
      }
    }
  }, [show, evolved])

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (show) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
    return undefined
  }, [show, handleKeyDown])

  // Evolution-specific confetti colors
  const evolutionColors = [
    '#FFD700', // Gold
    '#FF6B6B', // Coral
    '#4ECDC4', // Teal
    '#FF69B4', // Hot pink
    '#7B68EE', // Medium slate blue
  ]

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Confetti effect */}
          <Confetti
            show={show}
            particleCount={evolved ? 80 : 50}
            duration={evolved ? 4 : 3}
            colors={evolved ? evolutionColors : undefined}
          />

          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            role="button"
            tabIndex={0}
            aria-label="Close celebration"
          />

          {/* Modal content */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center pointer-events-auto"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="celebration-title"
            >
              {/* Evolution badge (if evolved) */}
              {evolved && (
                <motion.div
                  className="mb-4"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                >
                  <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg">
                    EVOLUTION!
                  </span>
                </motion.div>
              )}

              {/* Stars decoration */}
              <motion.div
                className="text-4xl mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {evolved ? '***' : '**'}
              </motion.div>

              {/* Habitanimal name */}
              <motion.h2
                id="celebration-title"
                className="text-xl font-semibold text-gray-700 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {habitanimalName}
              </motion.h2>

              {/* Level up message */}
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  Level Up!
                </h3>
                <motion.div
                  className="flex items-center justify-center gap-3 text-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="text-gray-400">Lv.{newLevel - 1}</span>
                  <motion.span
                    className="text-amber-500"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: 2, duration: 0.3 }}
                  >
                    {'->'}
                  </motion.span>
                  <motion.span
                    className="text-amber-500 font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    Lv.{newLevel}
                  </motion.span>
                </motion.div>
              </motion.div>

              {/* Evolution message */}
              {evolved && newEvolutionStage && (
                <motion.div
                  className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-gray-600 text-sm mb-1">Evolved to</p>
                  <motion.p
                    className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  >
                    {newEvolutionStage}
                  </motion.p>
                </motion.div>
              )}

              {/* Encouragement message */}
              <motion.p
                className="text-gray-500 text-sm mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: evolved ? 0.8 : 0.6 }}
              >
                {evolved
                  ? 'Amazing progress! Keep up the great work!'
                  : 'Keep building those habits!'}
              </motion.p>

              {/* Close button */}
              <motion.button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: evolved ? 0.9 : 0.7 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Awesome!
              </motion.button>

              {/* Auto-close indicator */}
              {autoCloseDelay > 0 && (
                <motion.div
                  className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <motion.div
                    className="h-full bg-gray-300"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{
                      duration: autoCloseDelay,
                      ease: 'linear',
                    }}
                  />
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Props for compact inline level-up notification
 */
interface LevelUpNotificationProps {
  /**
   * Whether to show the notification
   */
  show: boolean
  /**
   * Habitanimal name
   */
  habitanimalName: string
  /**
   * New level
   */
  newLevel: number
  /**
   * Callback when notification is dismissed
   */
  onDismiss: () => void
  /**
   * Auto-dismiss after seconds (0 to disable)
   * @default 3
   */
  autoDismissDelay?: number
}

/**
 * Compact level-up notification
 *
 * A smaller, less intrusive notification for level-ups.
 * Useful for when you don't want a full-screen celebration.
 */
export function LevelUpNotification({
  show,
  habitanimalName,
  newLevel,
  onDismiss,
  autoDismissDelay = 3,
}: LevelUpNotificationProps) {
  useEffect(() => {
    if (show && autoDismissDelay > 0) {
      const timer = setTimeout(onDismiss, autoDismissDelay * 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [show, autoDismissDelay, onDismiss])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-4 right-4 z-50"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-center gap-3 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={onDismiss}
            role="alert"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-lg">**</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">{habitanimalName}</p>
              <p className="font-semibold text-gray-900">
                Level Up! <span className="text-amber-500">Lv.{newLevel}</span>
              </p>
            </div>
            <button
              className="ml-2 text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation()
                onDismiss()
              }}
              aria-label="Dismiss notification"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
