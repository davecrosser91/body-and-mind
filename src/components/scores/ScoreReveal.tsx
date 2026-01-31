'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ScoreRing } from './ScoreRing';
import { EmberIndicator } from './EmberBar';

interface ScoreRevealProps {
  bodyScore: number;
  mindScore: number;
  balanceIndex: number;
  streakDays: number;
  isVisible: boolean;
  onComplete?: () => void;
}

export function ScoreReveal({
  bodyScore,
  mindScore,
  balanceIndex,
  streakDays,
  isVisible,
  onComplete,
}: ScoreRevealProps) {
  const [phase, setPhase] = useState<'entering' | 'revealing' | 'complete'>('entering');

  useEffect(() => {
    if (!isVisible) {
      setPhase('entering');
      return;
    }

    // Phase timing
    const revealTimer = setTimeout(() => setPhase('revealing'), 300);
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      onComplete?.();
    }, 2500);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, [isVisible, onComplete]);

  // Determine message based on scores
  const getMessage = () => {
    const avg = (bodyScore + mindScore) / 2;
    if (avg >= 80) return "Outstanding balance!";
    if (avg >= 60) return "Great progress today";
    if (avg >= 40) return "Keep building momentum";
    return "Every step counts";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="flex flex-col items-center p-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Greeting */}
            <motion.h2
              className="text-xl text-text-secondary mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Today&apos;s Balance
            </motion.h2>

            {/* Score rings */}
            <div className="flex items-center gap-6 md:gap-10">
              {/* Body */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <ScoreRing
                  score={phase === 'revealing' || phase === 'complete' ? bodyScore : 0}
                  pillar="body"
                  size={120}
                  animate={phase === 'revealing'}
                />
              </motion.div>

              {/* Balance */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <ScoreRing
                  score={phase === 'revealing' || phase === 'complete' ? balanceIndex : 0}
                  pillar="balance"
                  size={80}
                  strokeWidth={6}
                  animate={phase === 'revealing'}
                />
              </motion.div>

              {/* Mind */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <ScoreRing
                  score={phase === 'revealing' || phase === 'complete' ? mindScore : 0}
                  pillar="mind"
                  size={120}
                  animate={phase === 'revealing'}
                />
              </motion.div>
            </div>

            {/* Message */}
            <motion.p
              className="mt-8 text-lg text-text-primary font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
            >
              {getMessage()}
            </motion.p>

            {/* Streak */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              <EmberIndicator days={streakDays} />
            </motion.div>

            {/* Tap to continue hint */}
            <motion.p
              className="mt-8 text-sm text-text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 2.2 }}
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>

          {/* Background particles */}
          <BackgroundParticles />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Light particles floating in background
function BackgroundParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor:
              i % 2 === 0
                ? 'rgba(232, 168, 84, 0.3)'
                : 'rgba(91, 204, 179, 0.3)',
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Hook to trigger score reveal on first visit of the day
export function useScoreReveal() {
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    // Check if we've shown the reveal today
    const lastReveal = localStorage.getItem('lastScoreReveal');
    const today = new Date().toDateString();

    if (lastReveal !== today) {
      setShowReveal(true);
    }
  }, []);

  const dismissReveal = () => {
    localStorage.setItem('lastScoreReveal', new Date().toDateString());
    setShowReveal(false);
  };

  return { showReveal, dismissReveal };
}
