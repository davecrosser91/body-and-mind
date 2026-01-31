'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface AnimatedNumberProps {
  /**
   * The target number to animate to
   */
  value: number
  /**
   * Duration of the animation in seconds
   * @default 1
   */
  duration?: number
  /**
   * Format function for displaying the number
   * @default (n) => n.toLocaleString()
   */
  format?: (value: number) => string
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Animated number component that counts up/down to a target value
 *
 * Uses Framer Motion springs for smooth, natural-feeling animations.
 * Perfect for stats displays and counters.
 */
export function AnimatedNumber({
  value,
  duration = 1,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: AnimatedNumberProps) {
  const [isClient, setIsClient] = useState(false)

  // Spring animation for smooth counting
  const spring = useSpring(0, {
    stiffness: 100 / duration,
    damping: 30 / duration,
    mass: 1,
  })

  // Transform the spring value to formatted string
  const display = useTransform(spring, (current) => format(current))

  // Update spring target when value changes
  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  // Avoid hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <span className={className}>{format(0)}</span>
  }

  return <motion.span className={className}>{display}</motion.span>
}

/**
 * Props for percentage animated number
 */
interface AnimatedPercentageProps extends Omit<AnimatedNumberProps, 'format'> {
  /**
   * Number of decimal places
   * @default 0
   */
  decimals?: number
}

/**
 * Animated percentage display
 */
export function AnimatedPercentage({
  value,
  duration = 1,
  decimals = 0,
  className,
}: AnimatedPercentageProps) {
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      format={(n) => `${n.toFixed(decimals)}%`}
      className={className}
    />
  )
}

/**
 * Props for XP display
 */
interface AnimatedXPProps extends Omit<AnimatedNumberProps, 'format'> {
  /**
   * Whether to show the XP suffix
   * @default true
   */
  showSuffix?: boolean
}

/**
 * Animated XP display with optional suffix
 */
export function AnimatedXP({
  value,
  duration = 1,
  showSuffix = true,
  className,
}: AnimatedXPProps) {
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      format={(n) => {
        const formatted = Math.round(n).toLocaleString()
        return showSuffix ? `${formatted} XP` : formatted
      }}
      className={className}
    />
  )
}
