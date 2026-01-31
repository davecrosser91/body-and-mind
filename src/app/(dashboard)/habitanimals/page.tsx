'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { HabitanimalGrid } from '@/components/habitanimals/HabitanimalGrid'
import { HabitanimalCardProps } from '@/components/habitanimals/HabitanimalCard'
import { useAuth } from '@/hooks/useAuth'
import { getMood } from '@/lib/habitanimal-health'

type MoodType = 'happy' | 'neutral' | 'tired' | 'sad'

interface ApiHabitanimal {
  id: string
  type: 'FITNESS' | 'MINDFULNESS' | 'NUTRITION' | 'SLEEP' | 'LEARNING'
  species: string
  name: string
  level: number
  xp: number
  health: number
  evolutionStage: number
}

export default function HabitanimalsPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [habitanimals, setHabitanimals] = useState<HabitanimalCardProps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHabitanimals() {
      if (!token) return

      try {
        const response = await fetch('/api/v1/habitanimals', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch habitanimals')
        }

        const data = await response.json()
        const items: ApiHabitanimal[] = data.data?.items || data.data || []

        const mapped: HabitanimalCardProps[] = items.map((h) => ({
          id: h.id,
          name: h.name,
          species: h.species,
          type: h.type,
          level: h.level,
          xp: h.xp,
          health: h.health,
          mood: getMood(h.health) as MoodType,
          evolutionStage: h.evolutionStage,
        }))

        setHabitanimals(mapped)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchHabitanimals()
  }, [token])

  const handleHabitanimalClick = (id: string) => {
    router.push(`/habitanimals/${id}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Habitanimals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Click on a Habitanimal to see details and history
          </p>
        </div>
      </motion.div>

      <HabitanimalGrid
        habitanimals={habitanimals}
        onHabitanimalClick={handleHabitanimalClick}
      />

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
      >
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total XP</p>
          <p className="text-2xl font-bold text-gray-900">
            {habitanimals.reduce((sum, h) => sum + h.xp, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Average Level</p>
          <p className="text-2xl font-bold text-gray-900">
            {habitanimals.length > 0
              ? Math.round(habitanimals.reduce((sum, h) => sum + h.level, 0) / habitanimals.length)
              : 0}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Average Health</p>
          <p className="text-2xl font-bold text-gray-900">
            {habitanimals.length > 0
              ? Math.round(habitanimals.reduce((sum, h) => sum + h.health, 0) / habitanimals.length)
              : 0}%
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Happiest</p>
          <p className="text-2xl font-bold text-gray-900">
            {habitanimals.length > 0
              ? habitanimals.reduce((best, h) => (h.health > best.health ? h : best)).name
              : '-'}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
