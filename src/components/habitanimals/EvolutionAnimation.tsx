'use client'

import { useEffect, useCallback, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HabitanimalIcon, HabitanimalSpecies, EvolutionStage } from './icons'
import { Confetti } from '../ui/Confetti'
import { getEvolutionStageName } from '@/lib/xp'

export interface EvolutionAnimationProps {
  /**
   * The species of the habitanimal evolving
   */
  species: HabitanimalSpecies
  /**
   * The evolution stage transitioning from (1-4)
   */
  fromStage: number
  /**
   * The evolution stage transitioning to (1-4)
   */
  toStage: number
  /**
   * Callback when the animation completes or is dismissed
   */
  onComplete: () => void
}

// Animation phase durations in milliseconds
const PHASE_DURATIONS = {
  backdrop: 300,
  showOld: 800,
  transformation: 1500,
  flash: 300,
  reveal: 1000,
  text: 500,
  confetti: 1500,
} as const

type AnimationPhase = 'backdrop' | 'showOld' | 'transformation' | 'flash' | 'reveal' | 'text' | 'confetti' | 'done'

// Energy particle for transformation effect
interface EnergyParticle {
  id: number
  angle: number
  distance: number
  delay: number
  color: string
}

// Sparkle for legendary reveal
interface Sparkle {
  id: number
  x: number
  y: number
  delay: number
  size: number
}

// Sound effect placeholders
const playTransformSound = () => {
  console.log('[Sound] Evolution transformation sound would play here')
}

const playEvolutionCompleteSound = () => {
  console.log('[Sound] Evolution complete sound would play here')
}

/**
 * Full-screen evolution animation component
 *
 * Displays a dramatic animation sequence when a habitanimal evolves
 * from one stage to the next.
 */
export function EvolutionAnimation({
  species,
  fromStage,
  toStage,
  onComplete,
}: EvolutionAnimationProps) {
  const [phase, setPhase] = useState<AnimationPhase>('backdrop')
  const [showConfetti, setShowConfetti] = useState(false)

  // Evolution stage colors for effects
  const evolutionColors = useMemo(() => {
    const baseColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#7B68EE']
    if (toStage === 4) {
      // Legendary gets golden colors
      return ['#FFD700', '#FFA500', '#FFEC8B', '#FFE4B5', '#FFFACD']
    }
    return baseColors
  }, [toStage])

  // Generate energy particles for transformation swirl
  const energyParticles = useMemo<EnergyParticle[]>(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      angle: (360 / 20) * i,
      distance: 80 + Math.random() * 40,
      delay: i * 0.05,
      color: evolutionColors[i % evolutionColors.length] as string,
    }))
  }, [evolutionColors])

  // Generate sparkles for reveal
  const sparkles = useMemo<Sparkle[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      delay: Math.random() * 0.5,
      size: 4 + Math.random() * 8,
    }))
  }, [])

  // Progress through animation phases
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    const schedulePhase = (nextPhase: AnimationPhase, delay: number) => {
      const timer = setTimeout(() => setPhase(nextPhase), delay)
      timers.push(timer)
    }

    let elapsed = 0

    // Phase 1: Backdrop fade in
    elapsed += PHASE_DURATIONS.backdrop

    // Phase 2: Show old stage with glow
    schedulePhase('showOld', elapsed)
    elapsed += PHASE_DURATIONS.showOld

    // Phase 3: Transformation effect
    schedulePhase('transformation', elapsed)
    playTransformSound()
    elapsed += PHASE_DURATIONS.transformation

    // Phase 4: Flash/burst
    schedulePhase('flash', elapsed)
    elapsed += PHASE_DURATIONS.flash

    // Phase 5: Reveal new stage
    schedulePhase('reveal', elapsed)
    playEvolutionCompleteSound()
    elapsed += PHASE_DURATIONS.reveal

    // Phase 6: Show text
    schedulePhase('text', elapsed)
    elapsed += PHASE_DURATIONS.text

    // Phase 7: Confetti burst
    schedulePhase('confetti', elapsed)
    timers.push(setTimeout(() => setShowConfetti(true), elapsed))
    elapsed += PHASE_DURATIONS.confetti

    // Auto-close after ~4 seconds total
    schedulePhase('done', elapsed + 500)
    timers.push(setTimeout(onComplete, elapsed + 500))

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [onComplete])

  // Handle escape key and click to dismiss
  const handleDismiss = useCallback(() => {
    onComplete()
  }, [onComplete])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss()
      }
    },
    [handleDismiss]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const toStageName = getEvolutionStageName(toStage)

  // Determine glow color based on evolution stage
  const glowColor = toStage === 4 ? 'rgba(255, 215, 0, 0.6)' : 'rgba(168, 85, 247, 0.5)'

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <>
          {/* Confetti effect */}
          <Confetti
            show={showConfetti}
            particleCount={80}
            duration={3}
            colors={evolutionColors}
          />

          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: PHASE_DURATIONS.backdrop / 1000 }}
            onClick={handleDismiss}
            role="button"
            tabIndex={0}
            aria-label="Close evolution animation"
          />

          {/* Main animation container */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative flex flex-col items-center">
              {/* Energy particles swirl during transformation */}
              <AnimatePresence>
                {phase === 'transformation' && (
                  <>
                    {energyParticles.map((particle) => {
                      const radians = (particle.angle * Math.PI) / 180
                      return (
                        <motion.div
                          key={particle.id}
                          className="absolute w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: particle.color,
                            boxShadow: `0 0 10px ${particle.color}`,
                          }}
                          initial={{
                            x: Math.cos(radians) * particle.distance,
                            y: Math.sin(radians) * particle.distance,
                            opacity: 0,
                            scale: 0.5,
                          }}
                          animate={{
                            x: 0,
                            y: 0,
                            opacity: [0, 1, 1, 0],
                            scale: [0.5, 1.2, 0.8, 0],
                            rotate: 360,
                          }}
                          transition={{
                            duration: PHASE_DURATIONS.transformation / 1000,
                            delay: particle.delay,
                            ease: 'easeInOut',
                          }}
                        />
                      )
                    })}
                  </>
                )}
              </AnimatePresence>

              {/* Flash burst effect */}
              <AnimatePresence>
                {phase === 'flash' && (
                  <motion.div
                    className="absolute w-64 h-64 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                    }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 3, opacity: [0, 1, 0] }}
                    transition={{ duration: PHASE_DURATIONS.flash / 1000 }}
                  />
                )}
              </AnimatePresence>

              {/* Sparkles during reveal for Legendary */}
              <AnimatePresence>
                {(phase === 'reveal' || phase === 'text' || phase === 'confetti') && toStage === 4 && (
                  <>
                    {sparkles.map((sparkle) => (
                      <motion.div
                        key={sparkle.id}
                        className="absolute"
                        style={{
                          width: sparkle.size,
                          height: sparkle.size,
                          backgroundColor: '#FFD700',
                          boxShadow: '0 0 8px #FFD700',
                        }}
                        initial={{
                          x: sparkle.x,
                          y: sparkle.y,
                          opacity: 0,
                          rotate: 45,
                          scale: 0,
                        }}
                        animate={{
                          opacity: [0, 1, 1, 0],
                          scale: [0, 1, 1, 0],
                          rotate: [45, 45, 45, 45],
                        }}
                        transition={{
                          duration: 1.5,
                          delay: sparkle.delay,
                          repeat: Infinity,
                          repeatDelay: 0.5,
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>

              {/* Old stage icon with glow */}
              <AnimatePresence mode="wait">
                {(phase === 'showOld' || phase === 'transformation') && (
                  <motion.div
                    className="relative"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: phase === 'transformation' ? [1, 1.1, 0.9, 0] : 1,
                      opacity: phase === 'transformation' ? [1, 1, 1, 0] : 1,
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      duration: phase === 'transformation'
                        ? PHASE_DURATIONS.transformation / 1000
                        : 0.4,
                    }}
                  >
                    {/* Glow effect behind icon */}
                    <motion.div
                      className="absolute inset-0 rounded-full blur-xl"
                      style={{
                        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                        transform: 'scale(1.5)',
                      }}
                      animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [1.5, 1.8, 1.5],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      }}
                    />
                    <HabitanimalIcon
                      species={species}
                      mood="happy"
                      size={120}
                      evolutionStage={Math.min(Math.max(fromStage, 1), 4) as EvolutionStage}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* New stage icon reveal */}
              <AnimatePresence>
                {(phase === 'reveal' || phase === 'text' || phase === 'confetti') && (
                  <motion.div
                    className="relative"
                    initial={{ scale: 0, opacity: 0, rotate: -180 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                    }}
                  >
                    {/* Enhanced glow for new stage */}
                    <motion.div
                      className="absolute inset-0 rounded-full blur-xl"
                      style={{
                        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                        transform: 'scale(2)',
                      }}
                      animate={{
                        opacity: [0.6, 1, 0.6],
                        scale: [2, 2.3, 2],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      }}
                    />
                    <HabitanimalIcon
                      species={species}
                      mood="happy"
                      size={140}
                      evolutionStage={Math.min(Math.max(toStage, 1), 4) as EvolutionStage}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Evolution text */}
              <AnimatePresence>
                {(phase === 'text' || phase === 'confetti') && (
                  <motion.div
                    className="mt-8 text-center pointer-events-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <span className="text-white font-bold text-sm uppercase tracking-wide">
                        Evolution!
                      </span>
                    </motion.div>

                    <motion.h2
                      className={`text-3xl font-bold mb-2 ${
                        toStage === 4
                          ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 bg-clip-text text-transparent'
                          : 'text-white'
                      }`}
                      animate={
                        toStage === 4
                          ? {
                              backgroundPosition: ['0%', '100%', '0%'],
                            }
                          : {}
                      }
                      transition={
                        toStage === 4
                          ? {
                              duration: 2,
                              repeat: Infinity,
                              repeatType: 'reverse',
                            }
                          : {}
                      }
                      style={
                        toStage === 4
                          ? {
                              backgroundSize: '200% auto',
                            }
                          : {}
                      }
                    >
                      Evolved to {toStageName}!
                    </motion.h2>

                    <motion.p
                      className="text-gray-300 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {toStage === 4
                        ? 'Incredible achievement! Your dedication has unlocked legendary status!'
                        : 'Your companion grows stronger with your dedication!'}
                    </motion.p>

                    {/* Tap to close hint */}
                    <motion.p
                      className="text-gray-500 text-xs mt-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      Tap anywhere to continue
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
