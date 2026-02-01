import { Pillar } from '@prisma/client';

export const POINTS_THRESHOLD = 100;

interface CompletionWithActivity {
  pointsEarned: number;
  activity: {
    pillar: Pillar;
  };
}

export function calculateDailyPoints(
  completions: CompletionWithActivity[],
  pillar: Pillar
): number {
  return completions
    .filter((c) => c.activity.pillar === pillar)
    .reduce((sum, c) => sum + c.pointsEarned, 0);
}

export function isPillarComplete(points: number): boolean {
  return points >= POINTS_THRESHOLD;
}

export function getPointsProgress(points: number): number {
  return Math.min((points / POINTS_THRESHOLD) * 100, 100);
}

export function getPointsRemaining(points: number): number {
  return Math.max(POINTS_THRESHOLD - points, 0);
}
