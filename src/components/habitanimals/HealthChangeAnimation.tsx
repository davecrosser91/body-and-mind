'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface HealthChangeAnimationProps {
  /**
   * Amount of health change (positive or negative)
   */
  change: number
  /**
   * Type of health change
   */
  type: 'recovery' | 'decay'
  /**
   * Whether to show the animation
   */
  show: boolean
  /**
   * Callback when animation completes
   */
  onComplete?: () => void
  /**
   * Animation duration in seconds
   * @default 1.5
   */
  duration?: number
  /**
   * Position relative to parent
   * @default 'center'
   */
  position?: 'top' | 'center' | 'bottom'
}

/**
 * Health Change Animation Component
 *
 * Displays a floating health change indicator with sparkle/glow effects.
 * - Recovery: green sparkle/glow effect with "+X" text floating up
 * - Decay: red pulse/warning effect with "-X" text
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <HabitanimalCard {...props} />
 *   <HealthChangeAnimation
 *     change={15}
 *     type="recovery"
 *     show={showHealthAnimation}
 *     onComplete={() => setShowHealthAnimation(false)}
 *   />
 * </div>
 * ```
 */
export function HealthChangeAnimation({
  change,
  type,
  show,
  onComplete,
  duration = 1.5,
  position = 'center',
}: HealthChangeAnimationProps) {
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

  const isRecovery = type === 'recovery'
  const displayValue = isRecovery ? `+${Math.abs(change)}` : `-${Math.abs(change)}`
  const textColor = isRecovery ? 'text-emerald-500' : 'text-red-500'
  const glowColor = isRecovery ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`absolute ${getPositionClasses()} pointer-events-none z-10`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.2, 1, 0.8],
            y: isRecovery ? [0, -40] : [0, 10, 0],
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{
            duration: duration,
            times: [0, 0.15, 0.7, 1],
            ease: 'easeOut',
          }}
        >
          {/* Sparkle/Glow container */}
          <div className="relative">
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full blur-lg"
              style={{ backgroundColor: glowColor }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.5, 2],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: duration * 0.8,
                ease: 'easeOut',
              }}
            />

            {/* Sparkle particles for recovery */}
            {isRecovery && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-emerald-400 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: Math.cos((i * Math.PI * 2) / 6) * 30,
                      y: Math.sin((i * Math.PI * 2) / 6) * 30 - 20,
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: duration * 0.7,
                      delay: i * 0.05,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </>
            )}

            {/* Pulse rings for decay */}
            {!isRecovery && (
              <>
                <motion.div
                  className="absolute inset-0 border-2 border-red-400 rounded-full"
                  style={{
                    width: 40,
                    height: 40,
                    left: '50%',
                    top: '50%',
                    marginLeft: -20,
                    marginTop: -20,
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{
                    scale: [0.5, 1.5, 2],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: duration * 0.6,
                    ease: 'easeOut',
                  }}
                />
                <motion.div
                  className="absolute inset-0 border-2 border-red-300 rounded-full"
                  style={{
                    width: 40,
                    height: 40,
                    left: '50%',
                    top: '50%',
                    marginLeft: -20,
                    marginTop: -20,
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{
                    scale: [0.5, 1.8, 2.5],
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: duration * 0.6,
                    delay: 0.1,
                    ease: 'easeOut',
                  }}
                />
              </>
            )}

            {/* Main text */}
            <motion.span
              className={`relative text-xl font-bold ${textColor} drop-shadow-lg whitespace-nowrap`}
              style={{
                textShadow: `0 0 10px ${glowColor}, 0 2px 4px rgba(0,0,0,0.2)`,
              }}
              animate={
                isRecovery
                  ? {}
                  : {
                      scale: [1, 1.1, 1, 1.1, 1],
                    }
              }
              transition={
                isRecovery
                  ? {}
                  : {
                      duration: 0.4,
                      repeat: 2,
                      repeatType: 'loop',
                    }
              }
            >
              {displayValue}
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Props for HealthChangeAnimationStack
 */
interface HealthChangeAnimationStackProps {
  /**
   * Array of health changes to animate
   */
  changes: Array<{
    id: string | number
    change: number
    type: 'recovery' | 'decay'
  }>
  /**
   * Callback when a specific animation completes
   */
  onChangeComplete?: (id: string | number) => void
  /**
   * Animation duration in seconds
   * @default 1.5
   */
  duration?: number
}

/**
 * Stack multiple health change animations
 *
 * Useful when multiple health changes happen in quick succession.
 * Each animation is staggered slightly for visual clarity.
 */
export function HealthChangeAnimationStack({
  changes,
  onChangeComplete,
  duration = 1.5,
}: HealthChangeAnimationStackProps) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
      <AnimatePresence mode="popLayout">
        {changes.map((item, index) => {
          const isRecovery = item.type === 'recovery'
          const displayValue = isRecovery
            ? `+${Math.abs(item.change)}`
            : `-${Math.abs(item.change)}`
          const textColor = isRecovery ? 'text-emerald-500' : 'text-red-500'
          const glowColor = isRecovery
            ? 'rgba(16, 185, 129, 0.6)'
            : 'rgba(239, 68, 68, 0.6)'

          return (
            <motion.div
              key={item.id}
              className="relative"
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: isRecovery ? -40 - index * 25 : index * 20,
                scale: 1,
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                duration: duration,
                times: [0, 0.15, 0.7, 1],
                ease: 'easeOut',
                delay: index * 0.15,
              }}
              onAnimationComplete={() => onChangeComplete?.(item.id)}
            >
              <span
                className={`text-lg font-bold ${textColor} drop-shadow-lg whitespace-nowrap`}
                style={{
                  textShadow: `0 0 8px ${glowColor}, 0 2px 4px rgba(0,0,0,0.2)`,
                }}
              >
                {displayValue}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
