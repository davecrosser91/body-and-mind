'use client'

type ColorVariant = 'fitness' | 'mindfulness' | 'nutrition' | 'sleep' | 'learning' | 'default'

interface ProgressBarProps {
  value: number // 0-100
  max?: number
  color?: ColorVariant
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const colorClasses: Record<ColorVariant, string> = {
  fitness: 'bg-fitness-500',
  mindfulness: 'bg-mindfulness-500',
  nutrition: 'bg-nutrition-500',
  sleep: 'bg-sleep-500',
  learning: 'bg-learning-500',
  default: 'bg-gray-500',
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({
  value,
  max = 100,
  color = 'default',
  size = 'md',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

interface HealthBarProps {
  health: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function HealthBar({ health, size = 'md', className = '' }: HealthBarProps) {
  // Color based on health level
  const getHealthColor = (h: number): string => {
    if (h >= 70) return 'bg-mindfulness-500' // Green for healthy
    if (h >= 40) return 'bg-nutrition-500' // Yellow for warning
    return 'bg-fitness-500' // Red for critical
  }

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} ${getHealthColor(health)} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(Math.max(health, 0), 100)}%` }}
          role="progressbar"
          aria-valuenow={health}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Health"
        />
      </div>
    </div>
  )
}
