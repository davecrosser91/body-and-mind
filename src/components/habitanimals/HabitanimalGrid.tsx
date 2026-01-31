'use client'

import { HabitanimalCard, HabitanimalCardProps } from './HabitanimalCard'

interface HabitanimalGridProps {
  habitanimals: HabitanimalCardProps[]
  onHabitanimalClick?: (id: string) => void
}

export function HabitanimalGrid({ habitanimals, onHabitanimalClick }: HabitanimalGridProps) {
  if (habitanimals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No habitanimals yet.</p>
        <p className="text-xs mt-1">Start adding habits to grow your companions!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {habitanimals.map((habitanimal, index) => (
        <HabitanimalCard
          key={habitanimal.id}
          {...habitanimal}
          delay={index * 0.1}
          onClick={onHabitanimalClick ? () => onHabitanimalClick(habitanimal.id) : undefined}
        />
      ))}
    </div>
  )
}
