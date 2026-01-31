'use client'

import React from 'react'

export interface HabitanimalIconProps {
  mood?: 'happy' | 'neutral' | 'tired' | 'sad'
  size?: number
  className?: string
}

const moodColors = {
  happy: { primary: '#eab308', secondary: '#fde047', accent: '#a16207' },
  neutral: { primary: '#c9a035', secondary: '#dcc565', accent: '#8a7025' },
  tired: { primary: '#a89050', secondary: '#c4b075', accent: '#786540' },
  sad: { primary: '#9ca3af', secondary: '#d1d5db', accent: '#6b7280' },
}

export function GreenyIcon({ mood = 'happy', size = 64, className = '' }: HabitanimalIconProps) {
  const colors = moodColors[mood]

  // Mood-based expression adjustments
  const eyeOffsetY = mood === 'tired' || mood === 'sad' ? 2 : 0
  const earDroop = mood === 'tired' ? 5 : mood === 'sad' ? 8 : 0
  const mouthCurve = mood === 'happy' ? 'M 26 40 Q 32 46 38 40' :
                     mood === 'neutral' ? 'M 27 42 L 37 42' :
                     mood === 'tired' ? 'M 27 44 Q 32 42 37 44' :
                     'M 26 46 Q 32 40 38 46'

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
      <ellipse cx="32" cy="48" rx="22" ry="14" fill={colors.primary} />

      {/* Head */}
      <ellipse cx="32" cy="26" rx="18" ry="16" fill={colors.primary} />

      {/* Snout */}
      <ellipse cx="32" cy="34" rx="10" ry="8" fill={colors.secondary} />

      {/* Horns */}
      <path
        d="M 16 18 Q 10 10 8 4"
        stroke={colors.accent}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 48 18 Q 54 10 56 4"
        stroke={colors.accent}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Ears */}
      <ellipse
        cx="12"
        cy={22 + earDroop}
        rx="4"
        ry="6"
        fill={colors.primary}
        transform={`rotate(${-20 - earDroop} 12 ${22 + earDroop})`}
      />
      <ellipse
        cx="52"
        cy={22 + earDroop}
        rx="4"
        ry="6"
        fill={colors.primary}
        transform={`rotate(${20 + earDroop} 52 ${22 + earDroop})`}
      />

      {/* Eyes */}
      <circle cx="24" cy={24 + eyeOffsetY} r="4" fill="white" />
      <circle cx="40" cy={24 + eyeOffsetY} r="4" fill="white" />
      <circle cx="25" cy={24 + eyeOffsetY} r="2" fill={colors.accent} />
      <circle cx="41" cy={24 + eyeOffsetY} r="2" fill={colors.accent} />
      <circle cx="26" cy={23 + eyeOffsetY} r="0.5" fill="white" />
      <circle cx="42" cy={23 + eyeOffsetY} r="0.5" fill="white" />

      {/* Nostrils */}
      <circle cx="28" cy="36" r="2" fill={colors.accent} />
      <circle cx="36" cy="36" r="2" fill={colors.accent} />

      {/* Mouth */}
      <path d={mouthCurve} stroke={colors.accent} strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Legs */}
      <rect x="16" y="54" width="6" height="8" rx="3" fill={colors.accent} />
      <rect x="42" y="54" width="6" height="8" rx="3" fill={colors.accent} />

      {/* Front legs hint */}
      <ellipse cx="20" cy="52" rx="5" ry="4" fill={colors.secondary} />
      <ellipse cx="44" cy="52" rx="5" ry="4" fill={colors.secondary} />
    </svg>
  )
}
