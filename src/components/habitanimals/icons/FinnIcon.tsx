'use client'

import React from 'react'

export interface HabitanimalIconProps {
  mood?: 'happy' | 'neutral' | 'tired' | 'sad'
  size?: number
  className?: string
}

const moodColors = {
  happy: { primary: '#a855f7', secondary: '#d8b4fe', accent: '#7c3aed' },
  neutral: { primary: '#9070c0', secondary: '#c0a8d8', accent: '#6a4a9a' },
  tired: { primary: '#8a80a0', secondary: '#b0a8c0', accent: '#6a607a' },
  sad: { primary: '#9ca3af', secondary: '#d1d5db', accent: '#6b7280' },
}

export function FinnIcon({ mood = 'happy', size = 64, className = '' }: HabitanimalIconProps) {
  const colors = moodColors[mood]

  // Mood-based expression adjustments
  const eyeOffsetY = mood === 'tired' || mood === 'sad' ? 1 : 0
  const earAngle = mood === 'tired' ? 10 : mood === 'sad' ? 15 : 0
  const mouthCurve = mood === 'happy' ? 'M 26 38 Q 32 44 38 38' :
                     mood === 'neutral' ? 'M 28 40 L 36 40' :
                     mood === 'tired' ? 'M 28 41 Q 32 39 36 41' :
                     'M 26 44 Q 32 38 38 44'
  const tailCurl = mood === 'happy' ? 'Q 56 48 52 40' :
                   mood === 'neutral' ? 'Q 54 50 52 44' :
                   'Q 52 54 50 50'

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
      <ellipse cx="32" cy="46" rx="14" ry="12" fill={colors.primary} />

      {/* Chest/belly */}
      <ellipse cx="32" cy="50" rx="8" ry="8" fill={colors.secondary} />

      {/* Head */}
      <ellipse cx="32" cy="24" rx="14" ry="12" fill={colors.primary} />

      {/* Snout */}
      <ellipse cx="32" cy="30" rx="8" ry="6" fill={colors.secondary} />

      {/* Ears - tall and pointed */}
      <path
        d="M 20 20 L 16 4 L 26 16 Z"
        fill={colors.primary}
        transform={`rotate(${earAngle} 20 12)`}
      />
      <path
        d="M 44 20 L 48 4 L 38 16 Z"
        fill={colors.primary}
        transform={`rotate(${-earAngle} 44 12)`}
      />
      {/* Inner ears */}
      <path
        d="M 20 18 L 18 8 L 24 16 Z"
        fill={colors.secondary}
        transform={`rotate(${earAngle} 20 12)`}
      />
      <path
        d="M 44 18 L 46 8 L 40 16 Z"
        fill={colors.secondary}
        transform={`rotate(${-earAngle} 44 12)`}
      />

      {/* Eyes - clever/alert look */}
      <ellipse cx="26" cy={22 + eyeOffsetY} rx="3" ry="4" fill="white" />
      <ellipse cx="38" cy={22 + eyeOffsetY} rx="3" ry="4" fill="white" />
      <ellipse cx="27" cy={23 + eyeOffsetY} rx="2" ry="2.5" fill={colors.accent} />
      <ellipse cx="39" cy={23 + eyeOffsetY} rx="2" ry="2.5" fill={colors.accent} />
      <circle cx="28" cy={22 + eyeOffsetY} r="0.5" fill="white" />
      <circle cx="40" cy={22 + eyeOffsetY} r="0.5" fill="white" />

      {/* Nose */}
      <ellipse cx="32" cy="32" rx="2" ry="1.5" fill={colors.accent} />

      {/* Mouth - clever smirk */}
      <path d={mouthCurve} stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Whisker dots */}
      <circle cx="24" cy="32" r="0.5" fill={colors.accent} />
      <circle cx="22" cy="34" r="0.5" fill={colors.accent} />
      <circle cx="40" cy="32" r="0.5" fill={colors.accent} />
      <circle cx="42" cy="34" r="0.5" fill={colors.accent} />

      {/* Front legs */}
      <rect x="24" y="52" width="4" height="8" rx="2" fill={colors.primary} />
      <rect x="36" y="52" width="4" height="8" rx="2" fill={colors.primary} />

      {/* Paws */}
      <ellipse cx="26" cy="60" rx="3" ry="2" fill={colors.accent} />
      <ellipse cx="38" cy="60" rx="3" ry="2" fill={colors.accent} />

      {/* Tail - fluffy and curled */}
      <path
        d={`M 46 48 ${tailCurl}`}
        stroke={colors.primary}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tail tip (white) */}
      <circle cx="52" cy={mood === 'happy' ? 40 : mood === 'neutral' ? 44 : 50} r="4" fill={colors.secondary} />
    </svg>
  )
}
