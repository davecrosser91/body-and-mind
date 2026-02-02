'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MindFABProps {
  onMeditationClick: () => void;
  onJournalingClick: () => void;
}

const MIND_COLOR = '#7C9EE9';

export function MindFAB({ onMeditationClick, onJournalingClick }: MindFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMeditationClick = () => {
    setIsOpen(false);
    onMeditationClick();
  };

  const handleJournalingClick = () => {
    setIsOpen(false);
    onJournalingClick();
  };

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Items */}
            <motion.div
              className="absolute bottom-16 right-0 flex flex-col gap-3 items-end"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {/* Meditation Option */}
              <motion.button
                onClick={handleMeditationClick}
                className="flex items-center gap-3 bg-surface border border-surface-lighter rounded-full pl-4 pr-3 py-2 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
                <span className="text-sm font-medium text-text-primary">Log Meditation</span>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${MIND_COLOR}20` }}
                >
                  <span className="text-xl">🧘</span>
                </div>
              </motion.button>

              {/* Journaling Option */}
              <motion.button
                onClick={handleJournalingClick}
                className="flex items-center gap-3 bg-surface border border-surface-lighter rounded-full pl-4 pr-3 py-2 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-sm font-medium text-text-primary">Write Journal</span>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${MIND_COLOR}20` }}
                >
                  <span className="text-xl">📝</span>
                </div>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{ backgroundColor: MIND_COLOR }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </motion.button>
    </div>
  );
}
