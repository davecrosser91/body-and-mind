'use client'

import React from 'react'

export interface HabitanimalIconProps {
  mood?: 'happy' | 'neutral' | 'tired' | 'sad'
  size?: number
  className?: string
}

const moodColors = {
  happy: { primary: '#22c55e', secondary: '#86efac', accent: '#15803d' },
  neutral: { primary: '#5a9c6e', secondary: '#9ec9ab', accent: '#3d7050' },
  tired: { primary: '#7a9c85', secondary: '#a8c9b3', accent: '#5a7a64' },
  sad: { primary: '#9ca3af', secondary: '#d1d5db', accent: '#6b7280' },
}

export function ZenIcon({ mood = 'happy', size = 64, className = '' }: HabitanimalIconProps) {
  const colors = moodColors[mood]

  // Mood-based expression adjustments
  const eyeHeight = mood === 'happy' ? 2 : mood === 'neutral' ? 3 : mood === 'tired' ? 1 : 2
  const eyeOffsetY = mood === 'tired' || mood === 'sad' ? 1 : 0
  const mouthCurve = mood === 'happy' ? 'M 28 38 Q 32 42 36 38' :
                     mood === 'neutral' ? 'M 29 39 L 35 39' :
                     mood === 'tired' ? 'M 29 40 Q 32 39 35 40' :
                     'M 28 42 Q 32 38 36 42'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shell */}
      <ellipse cx="32" cy="40" rx="24" ry="18" fill={colors.primary} />

      {/* Shell pattern */}
      <ellipse cx="32" cy="38" rx="18" ry="13" fill={colors.accent} />
      <ellipse cx="32" cy="38" rx="12" ry="9" fill={colors.primary} />
      <ellipse cx="32" cy="38" rx="6" ry="5" fill={colors.accent} />

      {/* Shell highlight */}
      <ellipse cx="26" cy="34" rx="3" ry="2" fill={colors.secondary} opacity="0.5" />

      {/* Head */}
      <ellipse cx="32" cy="20" rx="10" ry="12" fill={colors.secondary} />

      {/* Eyes - peaceful/zen style */}
      <ellipse cx="28" cy={22 + eyeOffsetY} rx="2" ry={eyeHeight} fill={colors.accent} />
      <ellipse cx="36" cy={22 + eyeOffsetY} rx="2" ry={eyeHeight} fill={colors.accent} />

      {/* Eye shine */}
      {mood !== 'tired' && (
        <>
          <circle cx="29" cy={21 + eyeOffsetY} r="0.5" fill="white" />
          <circle cx="37" cy={21 + eyeOffsetY} r="0.5" fill="white" />
        </>
      )}

      {/* Peaceful smile */}
      <path d={mouthCurve} stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Front legs */}
      <ellipse cx="14" cy="50" rx="5" ry="6" fill={colors.secondary} />
      <ellipse cx="50" cy="50" rx="5" ry="6" fill={colors.secondary} />

      {/* Back legs */}
      <ellipse cx="18" cy="54" rx="4" ry="5" fill={colors.secondary} />
      <ellipse cx="46" cy="54" rx="4" ry="5" fill={colors.secondary} />

      {/* Tail */}
      <ellipse cx="32" cy="58" rx="3" ry="2" fill={colors.secondary} />
    </svg>
  )
}
