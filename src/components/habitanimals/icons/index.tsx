'use client'

import React from 'react'
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

// Extended props for the unified component
export interface HabitanimalIconComponentProps extends HabitanimalIconProps {
  species: HabitanimalSpecies
}

// Map species to components
const iconComponents: Record<HabitanimalSpecies, React.ComponentType<HabitanimalIconProps>> = {
  guiro: GuiroIcon,
  zen: ZenIcon,
  greeny: GreenyIcon,
  milo: MiloIcon,
  finn: FinnIcon,
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
 * ```
 */
export function HabitanimalIcon({
  species,
  mood = 'happy',
  size = 64,
  className = ''
}: HabitanimalIconComponentProps) {
  const IconComponent = iconComponents[species]

  if (!IconComponent) {
    console.warn(`Unknown habitanimal species: ${species}`)
    return null
  }

  return <IconComponent mood={mood} size={size} className={className} />
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
