'use client'

import React from 'react'

export interface HabitanimalIconProps {
  mood?: 'happy' | 'neutral' | 'tired' | 'sad'
  size?: number
  className?: string
}

const moodColors = {
  happy: { primary: '#ef4444', secondary: '#fca5a5', accent: '#dc2626' },
  neutral: { primary: '#d97373', secondary: '#e8a6a6', accent: '#c45c5c' },
  tired: { primary: '#b08585', secondary: '#c9a8a8', accent: '#9a7070' },
  sad: { primary: '#9ca3af', secondary: '#d1d5db', accent: '#6b7280' },
}

export function GuiroIcon({ mood = 'happy', size = 64, className = '' }: HabitanimalIconProps) {
  const colors = moodColors[mood]

  // Mood-based expression adjustments
  const eyeOffsetY = mood === 'tired' || mood === 'sad' ? 2 : 0
  const mouthCurve = mood === 'happy' ? 'M 22 42 Q 32 50 42 42' :
                     mood === 'neutral' ? 'M 24 44 L 40 44' :
                     mood === 'tired' ? 'M 24 46 Q 32 44 40 46' :
                     'M 22 48 Q 32 42 42 48'
  const browAngle = mood === 'sad' ? -5 : mood === 'tired' ? -3 : 0

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Body/Chest */}
      <ellipse cx="32" cy="52" rx="20" ry="12" fill={colors.secondary} />

      {/* Head */}
      <circle cx="32" cy="28" r="20" fill={colors.primary} />

      {/* Face plate */}
      <ellipse cx="32" cy="32" rx="12" ry="14" fill={colors.secondary} />

      {/* Ears */}
      <circle cx="14" cy="16" r="6" fill={colors.primary} />
      <circle cx="50" cy="16" r="6" fill={colors.primary} />
      <circle cx="14" cy="16" r="3" fill={colors.accent} />
      <circle cx="50" cy="16" r="3" fill={colors.accent} />

      {/* Brows */}
      <g transform={`rotate(${browAngle} 24 ${24 + eyeOffsetY})`}>
        <rect x="20" y={22 + eyeOffsetY} width="8" height="2" rx="1" fill={colors.accent} />
      </g>
      <g transform={`rotate(${-browAngle} 40 ${24 + eyeOffsetY})`}>
        <rect x="36" y={22 + eyeOffsetY} width="8" height="2" rx="1" fill={colors.accent} />
      </g>

      {/* Eyes */}
      <circle cx="24" cy={28 + eyeOffsetY} r="3" fill={colors.accent} />
      <circle cx="40" cy={28 + eyeOffsetY} r="3" fill={colors.accent} />
      <circle cx="25" cy={27 + eyeOffsetY} r="1" fill="white" />
      <circle cx="41" cy={27 + eyeOffsetY} r="1" fill="white" />

      {/* Nose */}
      <ellipse cx="32" cy="36" rx="4" ry="3" fill={colors.accent} />

      {/* Mouth */}
      <path d={mouthCurve} stroke={colors.accent} strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Arms/muscles hint */}
      <ellipse cx="12" cy="48" rx="6" ry="8" fill={colors.primary} />
      <ellipse cx="52" cy="48" rx="6" ry="8" fill={colors.primary} />
    </svg>
  )
}
