'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MindFABProps {
  onMeditationClick: () => void;
  onJournalingClick: () => void;
  onOtherActivityClick: () => void;
}

const MIND_COLOR = '#7C9EE9';

export function MindFAB({ onMeditationClick, onJournalingClick, onOtherActivityClick }: MindFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMeditationClick = () => {
    setIsOpen(false);
    onMeditationClick();
  };

  const handleJournalingClick = () => {
    setIsOpen(false);
    onJournalingClick();
  };

  const handleOtherActivityClick = () => {
    setIsOpen(false);
    onOtherActivityClick();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Activity Picker */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-24 right-4 z-50 bg-surface rounded-2xl border border-white/10 shadow-xl overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {/* Meditation Option */}
              <button
                onClick={handleMeditationClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-light transition-colors text-left"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${MIND_COLOR}20` }}
                >
                  <svg className="w-5 h-5" style={{ color: MIND_COLOR }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Log Meditation</p>
                  <p className="text-xs text-text-muted">Track your mindfulness</p>
                </div>
              </button>

              {/* Journaling Option */}
              <button
                onClick={handleJournalingClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-light transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Write Journal</p>
                  <p className="text-xs text-text-muted">Reflect and write</p>
                </div>
              </button>

              {/* Other Activity Option */}
              <button
                onClick={handleOtherActivityClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-light transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Other Activity</p>
                  <p className="text-xs text-text-muted">Any mind activity</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 transition-transform"
        style={{ backgroundColor: MIND_COLOR }}
      >
        <motion.svg
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-7 h-7 text-background"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </motion.svg>
      </motion.button>
    </>
  );
}
