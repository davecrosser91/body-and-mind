'use client'

import React from 'react'

export interface HabitanimalIconProps {
  mood?: 'happy' | 'neutral' | 'tired' | 'sad'
  size?: number
  className?: string
}

const moodColors = {
  happy: { primary: '#3b82f6', secondary: '#93c5fd', accent: '#1d4ed8' },
  neutral: { primary: '#5a7ab0', secondary: '#9db5d6', accent: '#3d5a8a' },
  tired: { primary: '#7a8fa5', secondary: '#a8b8c9', accent: '#5a6a7a' },
  sad: { primary: '#9ca3af', secondary: '#d1d5db', accent: '#6b7280' },
}

export function MiloIcon({ mood = 'happy', size = 64, className = '' }: HabitanimalIconProps) {
  const colors = moodColors[mood]

  // Mood-based expression adjustments - sloth is naturally sleepy looking
  const eyeOpenness = mood === 'happy' ? 3 : mood === 'neutral' ? 2 : mood === 'tired' ? 1 : 2
  const eyeOffsetY = mood === 'tired' || mood === 'sad' ? 1 : 0
  const mouthCurve = mood === 'happy' ? 'M 26 38 Q 32 44 38 38' :
                     mood === 'neutral' ? 'M 27 40 L 37 40' :
                     mood === 'tired' ? 'M 28 40 Q 32 38 36 40' :
                     'M 26 42 Q 32 38 38 42'
  const armDroop = mood === 'tired' ? 4 : mood === 'sad' ? 6 : 0

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Body */}
      <ellipse cx="32" cy="44" rx="16" ry="18" fill={colors.primary} />

      {/* Belly */}
      <ellipse cx="32" cy="48" rx="10" ry="12" fill={colors.secondary} />

      {/* Head */}
      <circle cx="32" cy="22" r="16" fill={colors.primary} />

      {/* Face mask */}
      <ellipse cx="32" cy="24" rx="12" ry="10" fill={colors.secondary} />

      {/* Eye patches (dark circles - sloths have these) */}
      <ellipse cx="24" cy={22 + eyeOffsetY} rx="5" ry="4" fill={colors.accent} />
      <ellipse cx="40" cy={22 + eyeOffsetY} rx="5" ry="4" fill={colors.accent} />

      {/* Eyes - naturally sleepy */}
      <ellipse cx="24" cy={22 + eyeOffsetY} rx="2" ry={eyeOpenness} fill="white" />
      <ellipse cx="40" cy={22 + eyeOffsetY} rx="2" ry={eyeOpenness} fill="white" />
      <ellipse cx="24" cy={22 + eyeOffsetY} rx="1" ry={Math.min(eyeOpenness, 1.5)} fill={colors.accent} />
      <ellipse cx="40" cy={22 + eyeOffsetY} rx="1" ry={Math.min(eyeOpenness, 1.5)} fill={colors.accent} />

      {/* Nose */}
      <ellipse cx="32" cy="30" rx="3" ry="2" fill={colors.accent} />

      {/* Mouth - gentle smile */}
      <path d={mouthCurve} stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Arms - hanging down like a sloth */}
      <path
        d={`M 16 36 Q 8 ${44 + armDroop} 10 ${56 + armDroop}`}
        stroke={colors.primary}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M 48 36 Q 56 ${44 + armDroop} 54 ${56 + armDroop}`}
        stroke={colors.primary}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Claws */}
      <circle cx="10" cy={58 + armDroop} r="3" fill={colors.accent} />
      <circle cx="54" cy={58 + armDroop} r="3" fill={colors.accent} />

      {/* Ears */}
      <circle cx="18" cy="12" r="4" fill={colors.primary} />
      <circle cx="46" cy="12" r="4" fill={colors.primary} />
    </svg>
  )
}
