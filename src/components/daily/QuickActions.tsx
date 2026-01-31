'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GlowButton } from '@/components/ui/GlowButton';

type Pillar = 'body' | 'mind';

interface QuickAction {
  activity: string;
  label: string;
  duration?: string;
  pillar: Pillar;
  icon?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (activity: string) => void;
  visible?: boolean;
  title?: string;
  className?: string;
}

export function QuickActions({
  actions,
  onAction,
  visible = true,
  title = 'Quick Actions',
  className = '',
}: QuickActionsProps) {
  return (
    <AnimatePresence>
      {visible && actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          <div className="space-y-3">
            {/* Section Title */}
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              >
                ⚡
              </motion.span>
              <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-3">
              {actions.map((action, index) => (
                <motion.div
                  key={action.activity}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <QuickActionButton
                    action={action}
                    onAction={onAction}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface QuickActionButtonProps {
  action: QuickAction;
  onAction: (activity: string) => void;
}

function QuickActionButton({ action, onAction }: QuickActionButtonProps) {
  const { activity, label, duration, pillar, icon } = action;

  return (
    <GlowButton
      variant={pillar}
      size="sm"
      glow={true}
      className="w-full justify-start"
      onClick={() => onAction(activity)}
    >
      <span className="flex items-center gap-2 text-left">
        {icon && <span className="text-base">{icon}</span>}
        <span className="flex flex-col">
          <span className="font-medium truncate">{label}</span>
          {duration && (
            <span className="text-xs opacity-75">{duration}</span>
          )}
        </span>
      </span>
    </GlowButton>
  );
}

// List variant for more actions
export function QuickActionsList({
  actions,
  onAction,
  visible = true,
  className = '',
}: QuickActionsProps) {
  return (
    <AnimatePresence>
      {visible && actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`space-y-2 ${className}`}
        >
          {actions.map((action, index) => (
            <motion.div
              key={action.activity}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <QuickActionListItem
                action={action}
                onAction={onAction}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QuickActionListItem({ action, onAction }: QuickActionButtonProps) {
  const { activity, label, duration, pillar, icon } = action;

  const borderColor = pillar === 'body' ? 'border-body/30' : 'border-mind/30';
  const hoverBorder = pillar === 'body' ? 'hover:border-body' : 'hover:border-mind';
  const accentColor = pillar === 'body' ? 'text-body' : 'text-mind';

  return (
    <motion.button
      className={`
        w-full flex items-center justify-between
        p-3 rounded-xl
        bg-surface/50 backdrop-blur-sm
        border ${borderColor} ${hoverBorder}
        transition-colors duration-200
      `}
      onClick={() => onAction(activity)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-text-primary font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {duration && (
          <span className="text-text-muted text-sm">{duration}</span>
        )}
        <span className={`${accentColor} text-lg`}>+</span>
      </div>
    </motion.button>
  );
}

// Urgency variant with animated border
export function QuickActionsUrgent({
  actions,
  onAction,
  visible = true,
  hoursRemaining = 24,
  className = '',
}: QuickActionsProps & { hoursRemaining?: number }) {
  if (!visible || actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative rounded-2xl p-4 overflow-hidden
        bg-error/5 border border-error/30
        ${className}
      `}
    >
      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-error/50"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      <div className="relative space-y-3">
        {/* Urgent Header */}
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            ⚠️
          </motion.span>
          <span className="text-error font-medium text-sm">
            {hoursRemaining}h left to save your streak!
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {actions.slice(0, 3).map((action) => (
            <GlowButton
              key={action.activity}
              variant={action.pillar}
              size="sm"
              glow={true}
              onClick={() => onAction(action.activity)}
            >
              {action.icon && <span>{action.icon}</span>}
              <span>{action.label}</span>
            </GlowButton>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
