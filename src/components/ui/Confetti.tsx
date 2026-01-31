'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiProps {
  /**
   * Whether to show the confetti animation
   */
  show: boolean
  /**
   * Number of confetti pieces to render
   * @default 50
   */
  particleCount?: number
  /**
   * Duration of the animation in seconds
   * @default 3
   */
  duration?: number
  /**
   * Callback when animation completes
   */
  onComplete?: () => void
  /**
   * Custom colors for confetti (defaults to a festive palette)
   */
  colors?: string[]
}

interface Particle {
  id: number
  x: number
  delay: number
  color: string
  rotation: number
  scale: number
  shape: 'square' | 'circle' | 'rectangle'
}

const DEFAULT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Sky Blue
]

/**
 * Confetti component for celebrations
 *
 * Renders colorful particles that fall from the top of the screen.
 * Uses Framer Motion for smooth animations.
 */
export function Confetti({
  show,
  particleCount = 50,
  duration = 3,
  onComplete,
  colors = DEFAULT_COLORS,
}: ConfettiProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  // Generate particles with random properties
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Random horizontal position (percentage)
      delay: Math.random() * 0.5, // Random delay up to 0.5s
      color: colors[Math.floor(Math.random() * colors.length)] as string,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5, // Scale between 0.5 and 1
      shape: (['square', 'circle', 'rectangle'] as const)[
        Math.floor(Math.random() * 3)
      ] as 'square' | 'circle' | 'rectangle',
    }))
  }, [particleCount, colors])

  useEffect(() => {
    if (show) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        onComplete?.()
      }, duration * 1000)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [show, duration, onComplete])

  const getShapeStyles = (shape: Particle['shape']): string => {
    switch (shape) {
      case 'circle':
        return 'w-3 h-3 rounded-full'
      case 'rectangle':
        return 'w-2 h-4 rounded-sm'
      case 'square':
        return 'w-3 h-3 rounded-sm'
    }
  }

  return (
    <AnimatePresence>
      {isAnimating && (
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden z-50"
          aria-hidden="true"
        >
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className={`absolute ${getShapeStyles(particle.shape)}`}
              style={{
                left: `${particle.x}%`,
                backgroundColor: particle.color,
                transform: `scale(${particle.scale})`,
              }}
              initial={{
                y: -20,
                opacity: 1,
                rotate: particle.rotation,
              }}
              animate={{
                y: '100vh',
                opacity: [1, 1, 0.8, 0],
                rotate: particle.rotation + 360 * (Math.random() > 0.5 ? 1 : -1),
                x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: duration * (0.8 + Math.random() * 0.4),
                delay: particle.delay,
                ease: 'easeIn',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

/**
 * Props for ConfettiBurst (centered burst variant)
 */
interface ConfettiBurstProps {
  /**
   * Whether to show the confetti burst
   */
  show: boolean
  /**
   * Number of confetti pieces
   * @default 30
   */
  particleCount?: number
  /**
   * Duration in seconds
   * @default 2
   */
  duration?: number
  /**
   * Callback when animation completes
   */
  onComplete?: () => void
  /**
   * Custom colors
   */
  colors?: string[]
  /**
   * Position of burst center
   */
  origin?: { x: number; y: number }
}

interface BurstParticle extends Particle {
  angle: number
  distance: number
}

/**
 * Confetti burst that explodes from a point
 *
 * Creates a radial burst effect, useful for celebrating specific achievements.
 */
export function ConfettiBurst({
  show,
  particleCount = 30,
  duration = 2,
  onComplete,
  colors = DEFAULT_COLORS,
  origin = { x: 50, y: 50 },
}: ConfettiBurstProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const particles = useMemo<BurstParticle[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: origin.x,
      delay: Math.random() * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)] as string,
      rotation: Math.random() * 360,
      scale: 0.4 + Math.random() * 0.6,
      shape: (['square', 'circle', 'rectangle'] as const)[
        Math.floor(Math.random() * 3)
      ] as 'square' | 'circle' | 'rectangle',
      angle: (360 / particleCount) * i + Math.random() * 30,
      distance: 100 + Math.random() * 200,
    }))
  }, [particleCount, colors, origin])

  useEffect(() => {
    if (show) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        onComplete?.()
      }, duration * 1000)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [show, duration, onComplete])

  const getShapeStyles = (shape: BurstParticle['shape']): string => {
    switch (shape) {
      case 'circle':
        return 'w-2 h-2 rounded-full'
      case 'rectangle':
        return 'w-1.5 h-3 rounded-sm'
      case 'square':
        return 'w-2 h-2 rounded-sm'
    }
  }

  return (
    <AnimatePresence>
      {isAnimating && (
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden z-50"
          aria-hidden="true"
        >
          {particles.map((particle) => {
            const radians = (particle.angle * Math.PI) / 180
            const endX = Math.cos(radians) * particle.distance
            const endY = Math.sin(radians) * particle.distance

            return (
              <motion.div
                key={particle.id}
                className={`absolute ${getShapeStyles(particle.shape)}`}
                style={{
                  left: `${origin.x}%`,
                  top: `${origin.y}%`,
                  backgroundColor: particle.color,
                  transform: `scale(${particle.scale})`,
                }}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  rotate: particle.rotation,
                }}
                animate={{
                  x: endX,
                  y: endY + 100, // Add gravity effect
                  opacity: [1, 1, 0.5, 0],
                  rotate: particle.rotation + 720,
                }}
                transition={{
                  duration: duration,
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
              />
            )
          })}
        </div>
      )}
    </AnimatePresence>
  )
}
