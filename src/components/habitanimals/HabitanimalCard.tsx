'use client'

import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { HealthBar, ProgressBar } from '../ui/ProgressBar'

type MoodType = 'happy' | 'neutral' | 'tired' | 'sad'
type HabitanimalType = 'FITNESS' | 'MINDFULNESS' | 'NUTRITION' | 'SLEEP' | 'LEARNING'

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
    <Card onClick={onClick} hoverable={!!onClick} className="min-w-0">
      {/* Header: Name and Level Badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Species Icon Placeholder */}
          <div className={`w-8 h-8 rounded-full ${typeBgColorMap[type]} flex items-center justify-center flex-shrink-0`}>
            <span className={`text-xs font-medium ${typeTextColorMap[type]}`}>
              {species.charAt(0).toUpperCase()}
            </span>
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

      {/* Footer: Mood and Evolution */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="font-mono">{moodEmoji[mood]}</span>
          <span>{moodLabel[mood]}</span>
        </div>
        <span>Stage {evolutionStage}</span>
      </div>
    </Card>
    </motion.div>
  )
}
