'use client';

import { motion } from 'framer-motion';

// ============ TYPES ============

interface RecoveryData {
  score: number;
  zone: 'green' | 'yellow' | 'red';
  hrv: number | null;
  restingHeartRate: number | null;
  recommendation: string | null;
}

interface SleepData {
  hours: number;
  efficiency: number;
  remHours: number;
  deepHours: number;
  performance: number;
}

interface WorkoutData {
  name: string;
  strain: number;
  duration: number;
  calories: number;
}

interface TrainingData {
  strain: number;
  calories: number;
  workouts: WorkoutData[];
}

// ============ HELPER FUNCTIONS ============

function getZoneColor(zone: 'green' | 'yellow' | 'red') {
  switch (zone) {
    case 'green':
      return { bg: '#10B981', text: 'text-emerald-400', badgeBg: 'bg-emerald-500/20', label: 'Recovered' };
    case 'yellow':
      return { bg: '#F59E0B', text: 'text-amber-300', badgeBg: 'bg-amber-500/20', label: 'Recovering' };
    case 'red':
      return { bg: '#EF4444', text: 'text-red-400', badgeBg: 'bg-red-500/20', label: 'Strained' };
  }
}

function getStrainColor(strain: number) {
  if (strain >= 18) return '#EF4444'; // Red - All out
  if (strain >= 14) return '#F59E0B'; // Amber - Strenuous
  if (strain >= 10) return '#10B981'; // Green - Moderate
  return '#6B7280'; // Gray - Light
}

// ============ CIRCULAR PROGRESS ============

function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color,
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ============ RECOVERY CARD ============

export function RecoveryCard({ data }: { data: RecoveryData }) {
  const zone = getZoneColor(data.zone);

  return (
    <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-5 border border-white/5">
      <div className="flex items-center gap-5">
        {/* Circular Progress */}
        <CircularProgress value={data.score} color={zone.bg} size={88} strokeWidth={7}>
          <div className="text-center">
            <span className={`text-2xl font-bold ${zone.text}`}>{data.score}</span>
            <span className={`text-xs ${zone.text}`}>%</span>
          </div>
        </CircularProgress>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-text-primary">Recovery</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${zone.text} ${zone.badgeBg}`}>
              {zone.label}
            </span>
          </div>

          {/* Metrics */}
          <div className="flex gap-4 mt-3">
            {data.hrv !== null && (
              <div>
                <p className="text-xl font-semibold text-text-primary">
                  {Math.round(data.hrv)}
                  <span className="text-xs text-text-muted ml-1">ms</span>
                </p>
                <p className="text-xs text-text-muted">HRV</p>
              </div>
            )}
            {data.restingHeartRate !== null && (
              <div>
                <p className="text-xl font-semibold text-text-primary">
                  {data.restingHeartRate}
                  <span className="text-xs text-text-muted ml-1">bpm</span>
                </p>
                <p className="text-xs text-text-muted">Resting HR</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      {data.recommendation && (
        <p className="text-xs text-text-muted mt-4 pt-4 border-t border-white/5">
          {data.recommendation}
        </p>
      )}
    </div>
  );
}

// ============ SLEEP CARD ============

export function SleepCard({ data }: { data: SleepData }) {
  const totalSleepMinutes = data.hours * 60;
  const deepPercent = (data.deepHours / data.hours) * 100;
  const remPercent = (data.remHours / data.hours) * 100;
  const lightPercent = 100 - deepPercent - remPercent;

  return (
    <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-5 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Sleep</h3>
            <p className="text-xs text-text-muted">{data.performance}% of sleep need</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-indigo-400">{data.hours}h</p>
          <p className="text-xs text-text-muted">{data.efficiency}% efficiency</p>
        </div>
      </div>

      {/* Sleep Stage Bar */}
      <div className="mb-3">
        <div className="h-3 rounded-full overflow-hidden flex bg-white/5">
          <motion.div
            className="h-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${deepPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <motion.div
            className="h-full bg-indigo-400"
            initial={{ width: 0 }}
            animate={{ width: `${remPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          />
          <motion.div
            className="h-full bg-indigo-300/50"
            initial={{ width: 0 }}
            animate={{ width: `${lightPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>

      {/* Sleep Stage Legend */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-600" />
          <span className="text-text-secondary">{data.deepHours}h Deep</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-400" />
          <span className="text-text-secondary">{data.remHours}h REM</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-300/50" />
          <span className="text-text-secondary">{(data.hours - data.deepHours - data.remHours).toFixed(1)}h Light</span>
        </div>
      </div>
    </div>
  );
}

// ============ TRAINING CARD ============

export function TrainingCard({ data }: { data: TrainingData }) {
  const strainColor = getStrainColor(data.strain);
  const maxStrain = 21;
  const strainPercent = (data.strain / maxStrain) * 100;

  return (
    <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-5 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Day Strain</h3>
            <p className="text-xs text-text-muted">{data.workouts.length} activity{data.workouts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold" style={{ color: strainColor }}>{data.strain.toFixed(1)}</p>
          <p className="text-xs text-text-muted">{data.calories} kcal</p>
        </div>
      </div>

      {/* Strain Bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full overflow-hidden bg-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: strainColor }}
            initial={{ width: 0 }}
            animate={{ width: `${strainPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-muted mt-1">
          <span>0</span>
          <span>Light</span>
          <span>Moderate</span>
          <span>Strenuous</span>
          <span>21</span>
        </div>
      </div>

      {/* Workouts List */}
      {data.workouts.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-white/5">
          {data.workouts.map((workout, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getStrainColor(workout.strain) }}
                />
                <span className="text-sm text-text-secondary capitalize">{workout.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span>{workout.duration} min</span>
                <span>{workout.calories} kcal</span>
                <span className="font-medium" style={{ color: getStrainColor(workout.strain) }}>
                  {workout.strain.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ COMPACT STRAIN CARD ============

export function StrainCardCompact({ data }: { data: TrainingData }) {
  const strainColor = getStrainColor(data.strain);
  const maxStrain = 21;

  return (
    <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5 flex-1">
      <div className="flex items-center gap-4">
        {/* Circular Progress */}
        <CircularProgress value={data.strain} max={maxStrain} color={strainColor} size={72} strokeWidth={6}>
          <div className="text-center">
            <span className="text-xl font-bold" style={{ color: strainColor }}>{data.strain.toFixed(1)}</span>
          </div>
        </CircularProgress>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary">Strain</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {data.workouts.length} workout{data.workouts.length !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-text-secondary mt-1">{data.calories} kcal</p>
        </div>
      </div>
    </div>
  );
}

// ============ COMPACT RECOVERY CARD ============

export function RecoveryCardCompact({ data }: { data: RecoveryData }) {
  const zone = getZoneColor(data.zone);

  return (
    <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5 flex-1">
      <div className="flex items-center gap-4">
        {/* Circular Progress */}
        <CircularProgress value={data.score} color={zone.bg} size={72} strokeWidth={6}>
          <div className="text-center">
            <span className={`text-xl font-bold ${zone.text}`}>{data.score}</span>
            <span className={`text-xs ${zone.text}`}>%</span>
          </div>
        </CircularProgress>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-text-primary">Recovery</h3>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${zone.text} ${zone.badgeBg}`}>
              {zone.label}
            </span>
          </div>
          <div className="flex gap-3 mt-1.5">
            {data.hrv !== null && (
              <p className="text-sm text-text-secondary">
                {Math.round(data.hrv)}<span className="text-xs text-text-muted ml-0.5">ms</span>
              </p>
            )}
            {data.restingHeartRate !== null && (
              <p className="text-sm text-text-secondary">
                {data.restingHeartRate}<span className="text-xs text-text-muted ml-0.5">bpm</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ WHOOP CONNECTED CARD ============

export function WhoopConnectedCard({ lastSync }: { lastSync: string | null }) {
  return (
    <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-emerald-500/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-400">Whoop Connected</p>
          <p className="text-xs text-text-muted">
            {lastSync
              ? `Synced ${new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Waiting for data...'}
          </p>
        </div>
      </div>
    </div>
  );
}
