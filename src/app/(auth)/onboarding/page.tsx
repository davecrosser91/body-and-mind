'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HabitanimalIcon,
  speciesColors,
  speciesAnimals,
  type HabitanimalSpecies,
} from '@/components/habitanimals/icons'
import { useAuth } from '@/hooks/useAuth'

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete'

const TOTAL_STEPS = 4

const habitanimals: { species: HabitanimalSpecies; name: string }[] = [
  { species: 'guiro', name: 'Guiro' },
  { species: 'zen', name: 'Zen' },
  { species: 'greeny', name: 'Greeny' },
  { species: 'milo', name: 'Milo' },
  { species: 'finn', name: 'Finn' },
]

// Animation variants
const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
}

const pageTransition = {
  duration: 0.3,
}

function ProgressDots({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <motion.div
          key={index}
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            index === currentStep ? 'bg-gray-900' : 'bg-gray-300'
          }`}
          initial={false}
          animate={{
            scale: index === currentStep ? 1.2 : 1,
          }}
          transition={{ duration: 0.2 }}
        />
      ))}
    </div>
  )
}

function Step1Welcome({ userName }: { userName: string | null }) {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-5xl"
      >
        Welcome{userName ? `, ${userName}` : ''}!
      </motion.div>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-gray-600 text-lg max-w-sm mx-auto"
      >
        You&apos;re about to meet your 5 Habitanimals - companions that will grow and thrive as you build healthy habits.
      </motion.p>
    </div>
  )
}

function Step2MeetHabitanimals() {
  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-xl font-semibold text-center text-gray-900"
      >
        Meet your Habitanimals
      </motion.h2>

      <div className="grid grid-cols-1 gap-4">
        {habitanimals.map((animal, index) => {
          const colorInfo = speciesColors[animal.species]
          const animalType = speciesAnimals[animal.species]

          return (
            <motion.div
              key={animal.species}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-white border border-gray-100 shadow-sm"
            >
              <div
                className="flex-shrink-0 p-2 rounded-lg"
                style={{ backgroundColor: `${colorInfo.color}15` }}
              >
                <HabitanimalIcon species={animal.species} mood="happy" size={48} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{animal.name}</p>
                <p className="text-sm text-gray-500">
                  {animalType} - {colorInfo.name}
                </p>
              </div>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: colorInfo.color }}
              />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function Step3HowItWorks() {
  const features = [
    {
      title: 'Create habits',
      description: 'Add habits in 5 categories: Fitness, Mindfulness, Nutrition, Sleep, and Learning',
    },
    {
      title: 'Complete daily',
      description: 'Check off your habits each day to earn XP and keep your Habitanimals happy',
    },
    {
      title: 'Watch them grow',
      description: 'Your Habitanimals level up and evolve as you maintain your streaks',
    },
  ]

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-xl font-semibold text-center text-gray-900"
      >
        How it works
      </motion.h2>

      <div className="space-y-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.15, duration: 0.3 }}
            className="flex gap-4"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <div>
              <p className="font-medium text-gray-900">{feature.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function Step4GetStarted({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex justify-center"
      >
        <div className="flex -space-x-3">
          {habitanimals.map((animal, index) => (
            <motion.div
              key={animal.species}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="relative"
              style={{ zIndex: habitanimals.length - index }}
            >
              <div className="w-14 h-14 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center">
                <HabitanimalIcon species={animal.species} mood="happy" size={40} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="space-y-3"
      >
        <h2 className="text-xl font-semibold text-gray-900">You&apos;re all set!</h2>
        <p className="text-gray-600">
          Your Habitanimals are ready and waiting. Start building habits to watch them thrive.
        </p>
      </motion.div>

      <motion.button
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        onClick={onComplete}
        className="w-full px-6 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors duration-200"
      >
        Let&apos;s get started
      </motion.button>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)

  // Check if already completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_COMPLETE_KEY)
    if (completed) {
      router.replace('/dashboard')
    }
  }, [router])

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection(1)
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
    router.push('/dashboard')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1Welcome userName={user?.name || null} />
      case 1:
        return <Step2MeetHabitanimals />
      case 2:
        return <Step3HowItWorks />
      case 3:
        return <Step4GetStarted onComplete={handleComplete} />
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col min-h-[500px]">
      {/* Content area */}
      <div className="flex-1 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="space-y-6 pb-4">
        {/* Progress dots */}
        <ProgressDots currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Navigation buttons (except on last step) */}
        {currentStep < TOTAL_STEPS - 1 && (
          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 ${
                currentStep === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-200"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
