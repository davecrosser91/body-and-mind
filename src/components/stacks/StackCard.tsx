'use client';

import { motion } from 'framer-motion';
import { Stack } from './useStacks';
import { StackActivityChain } from './StackActivityChain';

const BODY_COLOR = '#E8A854';
const MIND_COLOR = '#5BCCB3';

function getStackPillar(activities: Stack['activities']): 'BODY' | 'MIND' | 'MIXED' {
  if (!activities || activities.length === 0) return 'BODY';
  const hasBody = activities.some(a => a.pillar === 'BODY');
  const hasMind = activities.some(a => a.pillar === 'MIND');
  if (hasBody && hasMind) return 'MIXED';
  if (hasBody) return 'BODY';
  return 'MIND';
}

interface StackCardProps {
  stack: Stack;
  onToggle: (id: string) => void;
  onEdit?: (stack: Stack) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function StackCard({ stack, onToggle, onEdit, onDelete, isLoading }: StackCardProps) {
  const activities = stack.activities || [];
  const pillar = getStackPillar(activities);
  const primaryColor = pillar === 'BODY' ? BODY_COLOR : pillar === 'MIND' ? MIND_COLOR : BODY_COLOR;

  const totalPoints = activities.reduce((sum, a) => sum + a.points, 0);

  const cueLabels: Record<string, string> = {
    TIME: 'At',
    LOCATION: 'When at',
    AFTER_ACTIVITY: 'After',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative p-5 rounded-2xl border-2 transition-all ${
        stack.isActive
          ? 'border-transparent shadow-lg'
          : 'border-surface-lighter bg-surface/50'
      }`}
      style={{
        backgroundColor: stack.isActive ? `${primaryColor}08` : undefined,
        borderColor: stack.isActive ? `${primaryColor}40` : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-text-primary">{stack.name}</h3>
            {stack.currentStreak > 0 && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                {stack.currentStreak} day{stack.currentStreak !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          {stack.description && (
            <p className="text-sm text-text-muted mt-1">{stack.description}</p>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => onToggle(stack.id)}
          disabled={isLoading}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          style={{
            backgroundColor: stack.isActive ? primaryColor : 'rgb(var(--surface-lighter))',
          }}
        >
          <motion.div
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
            animate={{ left: stack.isActive ? 'calc(100% - 20px)' : '4px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-3 text-sm">
        <div className="flex items-center gap-1 text-text-muted">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{activities.length} activities</span>
        </div>
        <div className="flex items-center gap-1" style={{ color: primaryColor }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <span>{totalPoints} pts</span>
        </div>
        {stack.completionBonus > 0 && (
          <div className="flex items-center gap-1 text-green-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>+{stack.completionBonus}% bonus</span>
          </div>
        )}
      </div>

      {/* Cue Info */}
      {stack.cueType && stack.cueValue && (
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm mb-3"
          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            {stack.cueType === 'TIME' && (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
            {stack.cueType === 'LOCATION' && (
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            )}
            {stack.cueType === 'AFTER_ACTIVITY' && (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            )}
          </svg>
          <span>{cueLabels[stack.cueType]} {stack.cueValue}</span>
        </div>
      )}

      {/* Activity Chain */}
      <StackActivityChain activities={activities} size="md" showPoints />

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-lighter">
        {onEdit && (
          <button
            onClick={() => onEdit(stack)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(stack.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Delete
          </button>
        )}
      </div>
    </motion.div>
  );
}
