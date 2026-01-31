'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface XPGainAnimationProps {
  /**
   * Amount of XP gained
   */
  xp: number
  /**
   * Whether to show the animation
   */
  show: boolean
  /**
   * Callback when animation completes
   */
  onComplete?: () => void
  /**
   * Custom color for the XP text
   * @default 'text-amber-500'
   */
  color?: string
  /**
   * Animation duration in seconds
   * @default 1.5
   */
  duration?: number
  /**
   * Position relative to parent
   * @default 'top'
   */
  position?: 'top' | 'center' | 'bottom'
}

/**
 * XP Gain Animation Component
 *
 * Displays a floating "+X XP" text that rises and fades out.
 * Designed to appear above habitanimal cards when XP is earned.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <HabitanimalCard {...props} />
 *   <XPGainAnimation
 *     xp={15}
 *     show={showXPAnimation}
 *     onComplete={() => setShowXPAnimation(false)}
 *   />
 * </div>
 * ```
 */
export function XPGainAnimation({
  xp,
  show,
  onComplete,
  color = 'text-amber-500',
  duration = 1.5,
  position = 'top',
}: XPGainAnimationProps) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, duration * 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [show, duration, onComplete])

  const getPositionClasses = (): string => {
    switch (position) {
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
      case 'bottom':
        return 'bottom-0 left-1/2 -translate-x-1/2'
      case 'top':
        return 'top-0 left-1/2 -translate-x-1/2'
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`absolute ${getPositionClasses()} pointer-events-none z-10`}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: -50 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: duration,
            times: [0, 0.1, 0.7, 1],
            ease: 'easeOut',
          }}
        >
          <span
            className={`text-lg font-bold ${color} drop-shadow-sm`}
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            +{xp} XP
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Props for XPGainAnimationStack
 */
interface XPGainAnimationStackProps {
  /**
   * Array of XP gains to animate
   */
  gains: Array<{
    id: string | number
    xp: number
  }>
  /**
   * Callback when a specific animation completes
   */
  onGainComplete?: (id: string | number) => void
  /**
   * Custom color for the XP text
   */
  color?: string
  /**
   * Animation duration in seconds
   * @default 1.5
   */
  duration?: number
}

/**
 * Stack multiple XP gain animations
 *
 * Useful when multiple completions happen in quick succession.
 * Each animation is staggered slightly for visual clarity.
 */
export function XPGainAnimationStack({
  gains,
  onGainComplete,
  color = 'text-amber-500',
  duration = 1.5,
}: XPGainAnimationStackProps) {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-10">
      <AnimatePresence mode="popLayout">
        {gains.map((gain, index) => (
          <motion.div
            key={gain.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -50 - index * 20,
              scale: 1,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              duration: duration,
              times: [0, 0.1, 0.7, 1],
              ease: 'easeOut',
              delay: index * 0.1,
            }}
            onAnimationComplete={() => onGainComplete?.(gain.id)}
          >
            <span
              className={`text-lg font-bold ${color} drop-shadow-sm whitespace-nowrap`}
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              +{gain.xp} XP
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/**
 * Props for XPGainBadge (non-floating variant)
 */
interface XPGainBadgeProps {
  /**
   * Amount of XP
   */
  xp: number
  /**
   * Whether to show the badge
   */
  show: boolean
  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Callback when animation completes
   */
  onComplete?: () => void
}

/**
 * XP Gain Badge
 *
 * A pulsing badge that shows XP gain, useful for inline displays.
 */
export function XPGainBadge({
  xp,
  show,
  size = 'md',
  onComplete,
}: XPGainBadgeProps) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [show, onComplete])

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.span
          className={`inline-flex items-center ${sizeClasses[size]} bg-amber-100 text-amber-700 font-semibold rounded-full`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: [1, 1.1, 1],
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{
            duration: 0.5,
            scale: {
              duration: 0.6,
              repeat: 2,
              repeatType: 'reverse',
            },
          }}
        >
          +{xp} XP
        </motion.span>
      )}
    </AnimatePresence>
  )
}
