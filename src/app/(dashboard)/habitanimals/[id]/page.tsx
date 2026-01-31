'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { HealthBar, ProgressBar } from '@/components/ui/ProgressBar'
import {
  HabitanimalIcon,
  HabitanimalSpecies,
  isValidSpecies,
} from '@/components/habitanimals/icons'

type MoodType = 'happy' | 'neutral' | 'tired' | 'sad'
type HabitanimalType = 'FITNESS' | 'MINDFULNESS' | 'NUTRITION' | 'SLEEP' | 'LEARNING'

interface HabitanimalDetail {
  id: string
  type: HabitanimalType
  species: string
  name: string
  level: number
  xp: number
  xpProgress: {
    current: number
    required: number
    percentage: number
  }
  health: number
  evolutionStage: number
  evolutionStageName: string
  nextEvolution: {
    stage: number
    stageName: string
    levelRequired: number
    levelsRemaining: number
  } | null
  mood: MoodType
  lastInteraction: string
  createdAt: string
  updatedAt: string
  healthHistory: Array<{ date: string; health: number }>
  relatedHabits: Array<{
    id: string
    name: string
    category: string
    recentCompletions: number
  }>
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

const typeBorderColorMap: Record<HabitanimalType, string> = {
  FITNESS: 'border-fitness-200',
  MINDFULNESS: 'border-mindfulness-200',
  NUTRITION: 'border-nutrition-200',
  SLEEP: 'border-sleep-200',
  LEARNING: 'border-learning-200',
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

const moodDescription: Record<MoodType, string> = {
  happy: 'Feeling great! Keep up the good work!',
  neutral: 'Doing okay. A few more completions would help!',
  tired: 'Getting tired. Needs some attention soon.',
  sad: 'Feeling neglected. Complete some habits to cheer them up!',
}

export default function HabitanimalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [habitanimal, setHabitanimal] = useState<HabitanimalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHabitanimal() {
      try {
        const response = await fetch(`/api/v1/habitanimals/${resolvedParams.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Habitanimal not found')
          } else {
            setError('Failed to load habitanimal')
          }
          return
        }
        const data = await response.json()
        setHabitanimal(data.data)
      } catch {
        setError('Failed to load habitanimal')
      } finally {
        setLoading(false)
      }
    }

    fetchHabitanimal()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  if (error || !habitanimal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{error || 'Something went wrong'}</p>
        <button
          onClick={() => router.push('/habitanimals')}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Back to Habitanimals
        </button>
      </div>
    )
  }

  const species = habitanimal.species.toLowerCase() as HabitanimalSpecies
  const validSpecies = isValidSpecies(species) ? species : 'guiro'
  const color = typeColorMap[habitanimal.type]

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push('/habitanimals')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Dashboard
      </motion.button>

      {/* Hero Section: Large Habitanimal Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className={`${typeBgColorMap[habitanimal.type]} ${typeBorderColorMap[habitanimal.type]} border-2`}>
          <div className="flex flex-col md:flex-row items-center gap-6 p-4">
            {/* Large Icon */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <HabitanimalIcon
                  species={validSpecies}
                  mood={habitanimal.mood}
                  size={128}
                />
              </motion.div>
              {/* Level badge */}
              <div
                className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-sm font-bold ${typeBgColorMap[habitanimal.type]} ${typeTextColorMap[habitanimal.type]} border-2 ${typeBorderColorMap[habitanimal.type]} shadow-sm`}
              >
                Lv.{habitanimal.level}
              </div>
            </div>

            {/* Name and basic info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className={`text-2xl font-bold ${typeTextColorMap[habitanimal.type]} mb-1`}>
                {habitanimal.name}
              </h1>
              <p className="text-gray-600 capitalize mb-2">
                {habitanimal.species} - {habitanimal.type.toLowerCase()}
              </p>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${typeBgColorMap[habitanimal.type]} ${typeTextColorMap[habitanimal.type]} text-sm font-medium`}>
                <span>{habitanimal.evolutionStageName}</span>
                <span className="opacity-50">|</span>
                <span>Stage {habitanimal.evolutionStage}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Health Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Health</h2>

          {/* Large Health Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Current Health</span>
              <span className="text-2xl font-bold text-gray-900">
                {habitanimal.health}%
              </span>
            </div>
            <HealthBar health={habitanimal.health} size="lg" />
          </div>

          {/* Mood Indicator */}
          <div className={`p-4 rounded-lg ${typeBgColorMap[habitanimal.type]} mb-6`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono">{moodEmoji[habitanimal.mood]}</span>
              <div>
                <p className={`font-semibold ${typeTextColorMap[habitanimal.type]}`}>
                  {moodLabel[habitanimal.mood]}
                </p>
                <p className="text-sm text-gray-600">
                  {moodDescription[habitanimal.mood]}
                </p>
              </div>
            </div>
          </div>

          {/* Health History Chart */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Last 7 Days
            </h3>
            <div className="flex items-end gap-1 h-24">
              {habitanimal.healthHistory.map((day, index) => {
                const height = `${Math.max(day.health, 5)}%`
                const isToday = index === habitanimal.healthHistory.length - 1

                return (
                  <motion.div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="w-full flex flex-col items-center justify-end h-20">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isToday
                            ? 'bg-gray-800'
                            : day.health >= 70
                              ? 'bg-emerald-400'
                              : day.health >= 40
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                        }`}
                        style={{ height, minHeight: '4px' }}
                      />
                    </div>
                    <span className={`text-xs ${isToday ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                      }).slice(0, 2)}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* XP/Level Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Experience & Evolution
          </h2>

          {/* Current Level Display */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`w-16 h-16 rounded-full ${typeBgColorMap[habitanimal.type]} flex items-center justify-center`}
            >
              <span className={`text-2xl font-bold ${typeTextColorMap[habitanimal.type]}`}>
                {habitanimal.level}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Level</p>
              <p className="text-lg font-semibold text-gray-900">
                Level {habitanimal.level}
              </p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">XP Progress</span>
              <span className="text-sm font-medium text-gray-900">
                {habitanimal.xpProgress.current} / {habitanimal.xpProgress.required} XP
              </span>
            </div>
            <ProgressBar
              value={habitanimal.xpProgress.current}
              max={habitanimal.xpProgress.required}
              color={color}
              size="md"
            />
            <p className="text-xs text-gray-500 mt-1">
              {habitanimal.xpProgress.percentage}% to Level {habitanimal.level + 1}
            </p>
          </div>

          {/* Evolution Stage */}
          <div className={`p-4 rounded-lg ${typeBgColorMap[habitanimal.type]}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Evolution Stage</p>
                <p className={`text-lg font-bold ${typeTextColorMap[habitanimal.type]}`}>
                  {habitanimal.evolutionStageName}
                </p>
              </div>
              {habitanimal.nextEvolution && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Next Evolution</p>
                  <p className={`font-semibold ${typeTextColorMap[habitanimal.type]}`}>
                    {habitanimal.nextEvolution.stageName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {habitanimal.nextEvolution.levelsRemaining} level
                    {habitanimal.nextEvolution.levelsRemaining !== 1 ? 's' : ''} away
                  </p>
                </div>
              )}
              {!habitanimal.nextEvolution && (
                <div className="text-right">
                  <p className={`font-semibold ${typeTextColorMap[habitanimal.type]}`}>
                    Max Evolution!
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Related Habits Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Related Habits
          </h2>

          {habitanimal.relatedHabits.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No habits linked to this habitanimal yet.
            </p>
          ) : (
            <div className="space-y-3">
              {habitanimal.relatedHabits.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-lg ${typeBgColorMap[habitanimal.type]}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full bg-${color}-500`}
                      style={{
                        backgroundColor:
                          habitanimal.type === 'FITNESS'
                            ? '#ef4444'
                            : habitanimal.type === 'MINDFULNESS'
                              ? '#14b8a6'
                              : habitanimal.type === 'NUTRITION'
                                ? '#22c55e'
                                : habitanimal.type === 'SLEEP'
                                  ? '#a855f7'
                                  : '#f97316',
                      }}
                    />
                    <span className="font-medium text-gray-900">{habit.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${typeTextColorMap[habitanimal.type]}`}>
                      {habit.recentCompletions} completion
                      {habit.recentCompletions !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-500">(7 days)</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${typeBgColorMap[habitanimal.type]}`}>
              <p className="text-xs text-gray-600">Total XP</p>
              <p className={`text-lg font-bold ${typeTextColorMap[habitanimal.type]}`}>
                {habitanimal.xp.toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${typeBgColorMap[habitanimal.type]}`}>
              <p className="text-xs text-gray-600">Created</p>
              <p className={`text-lg font-bold ${typeTextColorMap[habitanimal.type]}`}>
                {new Date(habitanimal.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${typeBgColorMap[habitanimal.type]}`}>
              <p className="text-xs text-gray-600">Last Interaction</p>
              <p className={`text-lg font-bold ${typeTextColorMap[habitanimal.type]}`}>
                {new Date(habitanimal.lastInteraction).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${typeBgColorMap[habitanimal.type]}`}>
              <p className="text-xs text-gray-600">Linked Habits</p>
              <p className={`text-lg font-bold ${typeTextColorMap[habitanimal.type]}`}>
                {habitanimal.relatedHabits.length}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
