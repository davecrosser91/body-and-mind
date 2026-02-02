'use client';

import { motion } from 'framer-motion';
import { ScoreRing } from '@/components/scores/ScoreRing';
import { GlassCard } from '@/components/ui/GlassCard';

interface PillarStatus {
  completed: boolean;
  score: number;
  activities: number;
}

interface DailyStatusCardProps {
  body: PillarStatus;
  mind: PillarStatus;
  onBodyClick?: () => void;
  onMindClick?: () => void;
  className?: string;
}

export function DailyStatusCard({
  body,
  mind,
  onBodyClick,
  onMindClick,
  className = '',
}: DailyStatusCardProps) {
  return (
    <GlassCard hover={false} className={`p-6 pb-10 ${className}`}>
      <div className="flex items-center justify-around gap-4">
        {/* Body Ring */}
        <PillarRing
          pillar="body"
          status={body}
          onClick={onBodyClick}
        />

        {/* Divider */}
        <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        {/* Mind Ring */}
        <PillarRing
          pillar="mind"
          status={mind}
          onClick={onMindClick}
        />
      </div>
    </GlassCard>
  );
}

interface PillarRingProps {
  pillar: 'body' | 'mind';
  status: PillarStatus;
  onClick?: () => void;
}

function PillarRing({ pillar, status, onClick }: PillarRingProps) {
  const { completed, score, activities } = status;
  const textColor = pillar === 'body' ? 'text-body' : 'text-mind';

  return (
    <motion.div
      className="relative cursor-pointer group"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <ScoreRing
        score={score}
        pillar={pillar}
        size={120}
        strokeWidth={6}
        showLabel={true}
        animate={true}
      />

      {/* Completion Indicator or Activity Badge */}
      <motion.div
        className="absolute -top-1 -right-1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
      >
        {completed ? (
          <CompletionCheckmark pillar={pillar} />
        ) : activities > 0 ? (
          <ActivityBadge count={activities} pillar={pillar} />
        ) : null}
      </motion.div>

      {/* View link - clickable affordance */}
      <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 ${textColor} opacity-60 group-hover:opacity-100 transition-opacity`}>
        <span className="text-xs font-medium">View</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );
}

function CompletionCheckmark({ pillar }: { pillar: 'body' | 'mind' }) {
  const bgColor = pillar === 'body' ? 'bg-body' : 'bg-mind';

  return (
    <motion.div
      className={`
        w-7 h-7 rounded-full ${bgColor}
        flex items-center justify-center
        shadow-lg
      `}
      animate={{
        boxShadow: [
          '0 0 8px rgba(34, 197, 94, 0.4)',
          '0 0 16px rgba(34, 197, 94, 0.6)',
          '0 0 8px rgba(34, 197, 94, 0.4)',
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg
        className="w-4 h-4 text-background"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </motion.div>
  );
}

function ActivityBadge({ count, pillar }: { count: number; pillar: 'body' | 'mind' }) {
  const bgColor = pillar === 'body' ? 'bg-body/20' : 'bg-mind/20';
  const textColor = pillar === 'body' ? 'text-body' : 'text-mind';
  const borderColor = pillar === 'body' ? 'border-body/40' : 'border-mind/40';

  return (
    <div
      className={`
        min-w-[24px] h-6 px-1.5 rounded-full
        ${bgColor} ${textColor} ${borderColor}
        border backdrop-blur-sm
        flex items-center justify-center
        text-xs font-bold
      `}
    >
      {count}
    </div>
  );
}

// Compact variant for smaller displays
export function DailyStatusCardCompact({
  body,
  mind,
  onBodyClick,
  onMindClick,
  className = '',
}: DailyStatusCardProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <CompactPillarRing
        pillar="body"
        status={body}
        onClick={onBodyClick}
      />
      <CompactPillarRing
        pillar="mind"
        status={mind}
        onClick={onMindClick}
      />
    </div>
  );
}

function CompactPillarRing({ pillar, status, onClick }: PillarRingProps) {
  const { completed, score, activities } = status;

  return (
    <motion.div
      className="relative cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <ScoreRing
        score={score}
        pillar={pillar}
        size={64}
        strokeWidth={4}
        showLabel={false}
        animate={true}
      />

      {completed && (
        <motion.div
          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-success flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <svg
            className="w-3 h-3 text-background"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
      )}

      {!completed && activities > 0 && (
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-surface-lighter text-text-secondary text-xs font-bold flex items-center justify-center">
          {activities}
        </div>
      )}
    </motion.div>
  );
}
