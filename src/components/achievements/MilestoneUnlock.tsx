'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Confetti } from '../ui/ParticleBurst';

export interface Milestone {
  type: 'streak' | 'perfect_day' | 'first_habit' | 'category_mastery';
  title: string;
  description: string;
  icon: 'fire' | 'star' | 'trophy' | 'crown' | 'lightning';
  value?: number;
}

interface MilestoneUnlockProps {
  milestone: Milestone | null;
  isVisible: boolean;
  onComplete: () => void;
}

const ICON_PATHS: Record<string, string> = {
  fire: 'M12 23c-4.97 0-9-3.58-9-8 0-3.93 2.5-6.63 5-9.5.87-1 1.5-2.5 1.5-4 0 0 1.31 1.88 1.72 3.5C11.5 6.5 12 7.5 13 8c1.5-2 2.5-4 2.5-6 0 0 2.53 2.95 4 7 .73 2.02 1 3.5 1 5 0 4.42-4.03 8-8.5 9z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  trophy: 'M8 21h8m-4-4v4m-5.5-8.5a9 9 0 0018 0V4H1.5v4.5z M18 8c3 0 3 4 0 4 M6 8c-3 0-3 4 0 4',
  crown: 'M3 17l3-11 6 4 6-4 3 11H3z M5 17v4h14v-4',
  lightning: 'M13 2L3 14h8l-1 8 10-12h-8l1-8z',
};

export function MilestoneUnlock({
  milestone,
  isVisible,
  onComplete,
}: MilestoneUnlockProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [phase, setPhase] = useState<'icon' | 'text' | 'complete'>('icon');

  useEffect(() => {
    if (isVisible && milestone) {
      setPhase('icon');
      setShowConfetti(true);

      const textTimer = setTimeout(() => setPhase('text'), 600);
      const completeTimer = setTimeout(() => setPhase('complete'), 3000);
      const dismissTimer = setTimeout(() => {
        onComplete();
        setShowConfetti(false);
      }, 4000);

      return () => {
        clearTimeout(textTimer);
        clearTimeout(completeTimer);
        clearTimeout(dismissTimer);
      };
    }
    return undefined;
  }, [isVisible, milestone, onComplete]);

  if (!milestone) return null;

  const iconPath = ICON_PATHS[milestone.icon] || ICON_PATHS.star;

  return (
    <>
      <Confetti isActive={showConfetti} />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onComplete}
          >
            {/* Backdrop with radial glow */}
            <motion.div
              className="absolute inset-0 bg-background/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Radial glow behind icon */}
            <motion.div
              className="absolute"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1.2], opacity: [0, 0.5, 0.3] }}
              transition={{ duration: 0.8 }}
              style={{
                width: 400,
                height: 400,
                background: 'radial-gradient(circle, rgba(232,168,84,0.4) 0%, transparent 70%)',
              }}
            />

            {/* Content */}
            <motion.div
              className="relative flex flex-col items-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {/* Icon container */}
              <motion.div
                className="relative mb-8"
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                  scale: [0, 1.3, 1],
                  rotate: [-180, 10, 0],
                }}
                transition={{
                  duration: 0.6,
                  type: 'spring',
                  stiffness: 200,
                }}
              >
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(232,168,84,0.6) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 0.8, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Icon circle */}
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-body to-body-light flex items-center justify-center shadow-lg shadow-body/30">
                  <motion.svg
                    className="w-16 h-16 text-background"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <path d={iconPath} />
                  </motion.svg>
                </div>

                {/* Sparkles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-body"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: Math.cos((i * 60 * Math.PI) / 180) * 80,
                      y: Math.sin((i * 60 * Math.PI) / 180) * 80,
                    }}
                    transition={{
                      delay: 0.4 + i * 0.05,
                      duration: 0.6,
                    }}
                  />
                ))}
              </motion.div>

              {/* Text content */}
              <AnimatePresence>
                {(phase === 'text' || phase === 'complete') && (
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.p
                      className="text-body text-sm font-medium uppercase tracking-wider mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Achievement Unlocked
                    </motion.p>
                    <motion.h2
                      className="text-3xl font-bold text-text-primary mb-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {milestone.title}
                    </motion.h2>
                    <motion.p
                      className="text-text-muted"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {milestone.description}
                    </motion.p>

                    {milestone.value !== undefined && (
                      <motion.div
                        className="mt-4 text-5xl font-bold text-body"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: 0.3, type: 'spring' }}
                      >
                        {milestone.value}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tap to dismiss */}
              <motion.p
                className="absolute -bottom-16 text-text-muted text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.5, 1] }}
                transition={{ delay: 2, duration: 2, repeat: Infinity }}
              >
                Tap to continue
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Hook to manage milestone display queue
export function useMilestoneQueue() {
  const [queue, setQueue] = useState<Milestone[]>([]);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const addMilestone = (milestone: Milestone) => {
    setQueue(prev => [...prev, milestone]);
  };

  useEffect(() => {
    if (!isVisible && queue.length > 0) {
      const nextMilestone = queue[0];
      if (nextMilestone) {
        setCurrentMilestone(nextMilestone);
        setIsVisible(true);
        setQueue(prev => prev.slice(1));
      }
    }
  }, [isVisible, queue]);

  const dismissCurrent = () => {
    setIsVisible(false);
    setCurrentMilestone(null);
  };

  return {
    currentMilestone,
    isVisible,
    addMilestone,
    dismissCurrent,
    hasQueue: queue.length > 0,
  };
}
