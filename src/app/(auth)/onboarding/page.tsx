'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

const TOTAL_STEPS = 4;

const BODY_COLOR = '#E8A854';
const MIND_COLOR = '#5BCCB3';

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
};

const pageTransition = {
  duration: 0.3,
};

function ProgressDots({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <motion.div
          key={index}
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            index === currentStep ? 'bg-body' : 'bg-surface-lighter'
          }`}
          initial={false}
          animate={{
            scale: index === currentStep ? 1.2 : 1,
          }}
          transition={{ duration: 0.2 }}
        />
      ))}
    </div>
  );
}

function Step1Welcome({ userName }: { userName: string | null }) {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Logo size={64} showText={false} className="mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-text-primary">
          Welcome{userName ? `, ${userName}` : ''}!
        </h1>
      </motion.div>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-text-muted text-lg max-w-sm mx-auto"
      >
        One simple goal: do <span className="text-body font-medium">at least one thing for your body</span> and <span className="text-mind font-medium">one thing for your mind</span> each day.
      </motion.p>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-text-muted text-sm italic max-w-xs mx-auto mt-4"
      >
        &ldquo;Self-care is not selfish. You cannot serve from an empty vessel.&rdquo;
        <span className="block text-text-muted/70 mt-1 not-italic">— Eleanor Brown</span>
      </motion.p>
    </div>
  );
}

function Step2BodyAndMind() {
  const pillars = [
    {
      name: 'Body',
      color: BODY_COLOR,
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      categories: ['Training', 'Sleep', 'Nutrition'],
    },
    {
      name: 'Mind',
      color: MIND_COLOR,
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      categories: ['Meditation', 'Reading', 'Learning', 'Journaling'],
    },
  ];

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-xl font-semibold text-center text-text-primary"
      >
        Two Pillars of Wellness
      </motion.h2>

      <div className="space-y-4">
        {pillars.map((pillar, index) => (
          <motion.div
            key={pillar.name}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.15, duration: 0.3 }}
            className="p-4 rounded-xl bg-surface-light border border-surface-lighter"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${pillar.color}20` }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke={pillar.color}
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={pillar.icon} />
                </svg>
              </div>
              <h3 className="font-semibold text-text-primary" style={{ color: pillar.color }}>
                {pillar.name}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {pillar.categories.map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-1 text-xs rounded-full"
                  style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
                >
                  {cat}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Step3HowItWorks() {
  const features = [
    {
      title: 'Create habits',
      description: 'Add habits for Body (Training, Sleep, Nutrition) and Mind (Meditation, Reading, Learning)',
    },
    {
      title: 'Do one thing each',
      description: 'Complete at least one Body and one Mind activity daily to maintain your streak',
    },
    {
      title: 'Build momentum',
      description: 'Stack habits together and watch your streaks grow over time',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-xl font-semibold text-center text-text-primary"
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
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-background"
              style={{ backgroundColor: index % 2 === 0 ? BODY_COLOR : MIND_COLOR }}
            >
              {index + 1}
            </div>
            <div>
              <p className="font-medium text-text-primary">{feature.title}</p>
              <p className="text-sm text-text-muted mt-0.5">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Step4GetStarted({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex justify-center gap-4"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${BODY_COLOR}20` }}
        >
          <svg
            className="w-10 h-10"
            fill="none"
            stroke={BODY_COLOR}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${MIND_COLOR}20` }}
        >
          <svg
            className="w-10 h-10"
            fill="none"
            stroke={MIND_COLOR}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="space-y-3"
      >
        <h2 className="text-xl font-semibold text-text-primary">You&apos;re all set!</h2>
        <p className="text-text-muted">
          Remember: just one thing for Body and one for Mind each day. That&apos;s all it takes.
        </p>
      </motion.div>

      <motion.button
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        onClick={onComplete}
        className="w-full px-6 py-3 rounded-xl bg-body text-background font-medium hover:bg-body/90 transition-colors duration-200"
      >
        Let&apos;s get started
      </motion.button>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  // Check if already completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
    if (completed) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    router.push('/dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1Welcome userName={user?.name || null} />;
      case 1:
        return <Step2BodyAndMind />;
      case 2:
        return <Step3HowItWorks />;
      case 3:
        return <Step4GetStarted onComplete={handleComplete} />;
      default:
        return null;
    }
  };

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
                  ? 'text-text-muted cursor-not-allowed'
                  : 'text-text-secondary hover:bg-surface-light'
              }`}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-body text-background hover:bg-body/90 transition-colors duration-200"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
