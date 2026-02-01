'use client';

import { ActivityInStack } from './useStacks';

const BODY_COLOR = '#E8A854';
const MIND_COLOR = '#5BCCB3';

interface StackActivityChainProps {
  activities: ActivityInStack[];
  size?: 'sm' | 'md' | 'lg';
  showPoints?: boolean;
  className?: string;
}

export function StackActivityChain({
  activities,
  size = 'md',
  showPoints = false,
  className = '',
}: StackActivityChainProps) {
  const sizeClasses = {
    sm: { pill: 'px-2 py-0.5 text-xs', icon: 'w-3 h-3', arrow: 'w-3 h-3' },
    md: { pill: 'px-3 py-1.5 text-sm', icon: 'w-4 h-4', arrow: 'w-4 h-4' },
    lg: { pill: 'px-4 py-2 text-base', icon: 'w-5 h-5', arrow: 'w-5 h-5' },
  };

  const classes = sizeClasses[size];

  if (!activities || activities.length === 0) {
    return (
      <div className={`text-text-muted text-sm ${className}`}>
        No activities in this stack
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {activities.map((activity, index) => {
        const color = activity.pillar === 'BODY' ? BODY_COLOR : MIND_COLOR;

        return (
          <div key={activity.id} className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1.5 ${classes.pill} rounded-lg font-medium`}
              style={{ backgroundColor: `${color}20`, color }}
            >
              <span>{activity.name}</span>
              {showPoints && (
                <span className="opacity-70">+{activity.points}</span>
              )}
            </div>
            {index < activities.length - 1 && (
              <svg
                className={`${classes.arrow} text-text-muted`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
