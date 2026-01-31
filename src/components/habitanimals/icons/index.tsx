'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { GuiroIcon, HabitanimalIconProps } from './GuiroIcon'
import { ZenIcon } from './ZenIcon'
import { GreenyIcon } from './GreenyIcon'
import { MiloIcon } from './MiloIcon'
import { FinnIcon } from './FinnIcon'

// Re-export individual icons
export { GuiroIcon } from './GuiroIcon'
export { ZenIcon } from './ZenIcon'
export { GreenyIcon } from './GreenyIcon'
export { MiloIcon } from './MiloIcon'
export { FinnIcon } from './FinnIcon'
export type { HabitanimalIconProps } from './GuiroIcon'

// Species types
export type HabitanimalSpecies = 'guiro' | 'zen' | 'greeny' | 'milo' | 'finn'

// Evolution stage type (1-4: Baby, Teen, Adult, Legendary)
export type EvolutionStage = 1 | 2 | 3 | 4

// Extended props for the unified component
export interface HabitanimalIconComponentProps extends HabitanimalIconProps {
  species: HabitanimalSpecies
  /**
   * Evolution stage affects visual appearance:
   * - 1 (Baby): 80% size, lighter colors, simpler features
   * - 2 (Teen): 100% size, standard colors
   * - 3 (Adult): 110% size, bolder colors, more detail
   * - 4 (Legendary): 120% size, golden glow, sparkle effect
   */
  evolutionStage?: EvolutionStage
}

// Map species to components
const iconComponents: Record<HabitanimalSpecies, React.ComponentType<HabitanimalIconProps>> = {
  guiro: GuiroIcon,
  zen: ZenIcon,
  greeny: GreenyIcon,
  milo: MiloIcon,
  finn: FinnIcon,
}

// Evolution stage visual configurations
const evolutionStageConfig: Record<EvolutionStage, {
  scale: number
  filter: string
  glowColor?: string
  hasSparkle: boolean
}> = {
  1: {
    // Baby: Smaller, lighter colors
    scale: 0.8,
    filter: 'brightness(1.15) saturate(0.85)',
    hasSparkle: false,
  },
  2: {
    // Teen: Normal appearance
    scale: 1.0,
    filter: 'none',
    hasSparkle: false,
  },
  3: {
    // Adult: Slightly larger, bolder colors
    scale: 1.1,
    filter: 'brightness(0.95) saturate(1.15) contrast(1.05)',
    hasSparkle: false,
  },
  4: {
    // Legendary: Largest, golden glow, sparkle effect
    scale: 1.2,
    filter: 'saturate(1.2) contrast(1.1)',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    hasSparkle: true,
  },
}

// Sparkle component for Legendary stage
function LegendarySparkles({ size }: { size: number }) {
  const sparkles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.cos((i * Math.PI * 2) / 6) * (size * 0.5),
      y: Math.sin((i * Math.PI * 2) / 6) * (size * 0.5),
      delay: i * 0.2,
    }))
  }, [size])

  return (
    <>
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            width: 6,
            height: 6,
            marginLeft: -3,
            marginTop: -3,
          }}
          animate={{
            x: [sparkle.x * 0.8, sparkle.x, sparkle.x * 0.8],
            y: [sparkle.y * 0.8, sparkle.y, sparkle.y * 0.8],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
            <path
              d="M3 0L3.5 2.5L6 3L3.5 3.5L3 6L2.5 3.5L0 3L2.5 2.5L3 0Z"
              fill="#FFD700"
            />
          </svg>
        </motion.div>
      ))}
    </>
  )
}

// Map species to their category colors (for reference)
export const speciesColors: Record<HabitanimalSpecies, { name: string; color: string }> = {
  guiro: { name: 'Fitness', color: '#ef4444' },
  zen: { name: 'Mindfulness', color: '#22c55e' },
  greeny: { name: 'Nutrition', color: '#eab308' },
  milo: { name: 'Sleep', color: '#3b82f6' },
  finn: { name: 'Learning', color: '#a855f7' },
}

// Map species to their animal type
export const speciesAnimals: Record<HabitanimalSpecies, string> = {
  guiro: 'Gorilla',
  zen: 'Turtle',
  greeny: 'Ox',
  milo: 'Sloth',
  finn: 'Fox',
}

/**
 * Unified Habitanimal icon component that renders the correct icon based on species
 *
 * @example
 * ```tsx
 * <HabitanimalIcon species="guiro" mood="happy" size={64} />
 * <HabitanimalIcon species="zen" mood="tired" size={48} className="opacity-50" />
 * <HabitanimalIcon species="milo" evolutionStage={4} size={80} /> // Legendary with sparkles
 * ```
 */
export function HabitanimalIcon({
  species,
  mood = 'happy',
  size = 64,
  className = '',
  evolutionStage = 2,
}: HabitanimalIconComponentProps) {
  const IconComponent = iconComponents[species]

  if (!IconComponent) {
    console.warn(`Unknown habitanimal species: ${species}`)
    return null
  }

  const stageConfig = evolutionStageConfig[evolutionStage]
  const scaledSize = Math.round(size * stageConfig.scale)

  // For stages without special effects, render simple icon
  if (!stageConfig.glowColor && !stageConfig.hasSparkle) {
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        style={{
          width: size,
          height: size,
        }}
      >
        <div
          style={{
            filter: stageConfig.filter,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent mood={mood} size={scaledSize} />
        </div>
      </div>
    )
  }

  // Legendary stage with glow and sparkles
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{
        width: size * 1.2,
        height: size * 1.2,
      }}
    >
      {/* Glow effect behind icon */}
      {stageConfig.glowColor && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: scaledSize * 1.3,
            height: scaledSize * 1.3,
            background: `radial-gradient(circle, ${stageConfig.glowColor} 0%, transparent 70%)`,
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      )}

      {/* The icon itself */}
      <div
        style={{
          filter: stageConfig.filter,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <IconComponent mood={mood} size={scaledSize} />
      </div>

      {/* Sparkle effects for Legendary */}
      {stageConfig.hasSparkle && <LegendarySparkles size={scaledSize} />}
    </div>
  )
}

/**
 * Get all available species
 */
export function getAllSpecies(): HabitanimalSpecies[] {
  return Object.keys(iconComponents) as HabitanimalSpecies[]
}

/**
 * Check if a string is a valid species
 */
export function isValidSpecies(species: string): species is HabitanimalSpecies {
  return species in iconComponents
}
