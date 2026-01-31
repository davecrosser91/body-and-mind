'use client'

import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { HealthBar, ProgressBar } from '../ui/ProgressBar'
import { HabitanimalIcon, HabitanimalSpecies, EvolutionStage } from './icons'
import { getEvolutionStageName } from '@/lib/xp'

type MoodType = 'happy' | 'neutral' | 'tired' | 'sad'
type HabitanimalType = 'FITNESS' | 'MINDFULNESS' | 'NUTRITION' | 'SLEEP' | 'LEARNING'

// Map species string to HabitanimalSpecies
const speciesMap: Record<string, HabitanimalSpecies> = {
  gorilla: 'guiro',
  turtle: 'zen',
  ox: 'greeny',
  sloth: 'milo',
  fox: 'finn',
  guiro: 'guiro',
  zen: 'zen',
  greeny: 'greeny',
  milo: 'milo',
  finn: 'finn',
}

export interface HabitanimalCardProps {
  id: string
  name: string // "Guiro", "Zen", etc.
  species: string // "gorilla", "turtle", etc.
  type: HabitanimalType
  level: number
  xp: number
  health: number
  mood: MoodType
  evolutionStage: number
  onClick?: () => void
  /**
   * Animation delay for staggered entrance
   */
  delay?: number
}

const typeColorMap: Record<HabitanimalType, 'fitness' | 'mindfulness' | 'nutrition' | 'sleep' | 'learning'> = {
  FITNESS: 'fitness',
  MINDFULNESS: 'mindfulness',
  NUTRITION: 'nutrition',
  SLEEP: 'sleep',
  LEARNING: 'learning',
}

const typeBgColorMap: Record<HabitanimalType, string> = {
  FITNESS: 'bg-fitness-50',
  MINDFULNESS: 'bg-mindfulness-50',
  NUTRITION: 'bg-nutrition-50',
  SLEEP: 'bg-sleep-50',
  LEARNING: 'bg-learning-50',
}

const typeTextColorMap: Record<HabitanimalType, string> = {
  FITNESS: 'text-fitness-600',
  MINDFULNESS: 'text-mindfulness-600',
  NUTRITION: 'text-nutrition-600',
  SLEEP: 'text-sleep-600',
  LEARNING: 'text-learning-600',
}

const moodEmoji: Record<MoodType, string> = {
  happy: ':)',
  neutral: ':|',
  tired: ':/',
  sad: ':(',
}

const moodLabel: Record<MoodType, string> = {
  happy: 'Happy',
  neutral: 'Neutral',
  tired: 'Tired',
  sad: 'Sad',
}

// Evolution stage badge colors
type BadgeColors = { bg: string; text: string; border?: string }
const evolutionBadgeColors: Record<EvolutionStage, BadgeColors> = {
  1: { bg: 'bg-gray-100', text: 'text-gray-600' },
  2: { bg: 'bg-blue-100', text: 'text-blue-600' },
  3: { bg: 'bg-purple-100', text: 'text-purple-600' },
  4: { bg: 'bg-gradient-to-r from-amber-200 to-yellow-300', text: 'text-amber-800', border: 'border border-amber-400' },
}

// XP required for each level (simplified formula)
function getXpForNextLevel(level: number): number {
  return level * 100
}

export function HabitanimalCard({
  name,
  species,
  type,
  level,
  xp,
  health,
  mood,
  evolutionStage,
  onClick,
  delay = 0,
}: HabitanimalCardProps) {
  const xpForNextLevel = getXpForNextLevel(level)
  const xpProgress = xp % xpForNextLevel
  const color = typeColorMap[type]

  // Get the mapped species for the icon
  const mappedSpecies = speciesMap[species.toLowerCase()] || 'guiro'

  // Ensure evolutionStage is a valid EvolutionStage (1-4)
  const validEvolutionStage = Math.min(Math.max(evolutionStage, 1), 4) as EvolutionStage

  // Get evolution stage name and badge colors
  const stageName = getEvolutionStageName(validEvolutionStage)
  const badgeColors = evolutionBadgeColors[validEvolutionStage]

  // Legendary glow effect
  const isLegendary = validEvolutionStage === 4

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      {/* Legendary glow effect behind card */}
      {isLegendary && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 165, 0, 0.2) 50%, rgba(255, 215, 0, 0.3) 100%)',
            filter: 'blur(8px)',
            transform: 'scale(1.02)',
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      )}

      <Card
        onClick={onClick}
        hoverable={!!onClick}
        className={`min-w-0 relative ${isLegendary ? 'ring-2 ring-amber-300 ring-opacity-50' : ''}`}
      >
        {/* Header: Name and Level Badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Species Icon with Evolution Stage */}
            <div className="relative flex-shrink-0">
              <HabitanimalIcon
                species={mappedSpecies}
                mood={mood}
                size={40}
                evolutionStage={validEvolutionStage}
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">{name}</h3>
              <p className="text-xs text-gray-500 capitalize truncate">{species}</p>
            </div>
          </div>

          {/* Level Badge */}
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${typeBgColorMap[type]} ${typeTextColorMap[type]} flex-shrink-0`}>
            Lv.{level}
          </div>
        </div>

        {/* Health Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Health</span>
            <span>{health}%</span>
          </div>
          <HealthBar health={health} size="sm" />
        </div>

        {/* XP Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>XP</span>
            <span>{xpProgress}/{xpForNextLevel}</span>
          </div>
          <ProgressBar value={xpProgress} max={xpForNextLevel} color={color} size="sm" />
        </div>

        {/* Footer: Mood and Evolution Stage Badge */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <span className="font-mono">{moodEmoji[mood]}</span>
            <span>{moodLabel[mood]}</span>
          </div>

          {/* Evolution Stage Badge */}
          <div
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border || ''}`}
          >
            {isLegendary ? (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" />
                </svg>
                {stageName}
              </span>
            ) : (
              stageName
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
