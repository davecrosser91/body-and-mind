# Body & Mind View Optimization - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure Body/Mind views with proper Activity hierarchy, points-based completion tracking (100 pts = streak), and specialized dashboards for predefined subcategories.

**Architecture:** Rename Habit → Activity with `isHabit` flag. SubCategories become strings (predefined + custom). Each predefined subcategory gets a rich Whoop-integrated dashboard. Points accumulate toward 100/day per pillar.

**Tech Stack:** Next.js, Prisma, PostgreSQL, Framer Motion, Whoop API v2

---

## Task 1: Schema Migration - Rename Habit to Activity

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Update the Habit model to Activity**

```prisma
model Activity {
  id          String       @id @default(cuid())
  name        String
  pillar      Pillar
  subCategory String       // Changed from enum to string
  frequency   Frequency    @default(DAILY)
  description String?
  points      Int          @default(25)
  isHabit     Boolean      @default(true)  // NEW: true = recurring habit
  cueType     CueType?
  cueValue    String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  archived    Boolean      @default(false)

  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  completions ActivityCompletion[]

  @@index([userId])
  @@index([pillar])
  @@index([subCategory])
}
```

**Step 2: Update HabitCompletion to ActivityCompletion**

```prisma
model ActivityCompletion {
  id           String    @id @default(cuid())
  completedAt  DateTime  @default(now())
  pointsEarned Int       // NEW: snapshot of points at completion
  details      String?
  source       Source    @default(MANUAL)

  activityId   String
  activity     Activity  @relation(fields: [activityId], references: [id], onDelete: Cascade)

  @@index([activityId])
  @@index([completedAt])
}
```

**Step 3: Update User model relations**

Change `habits Habit[]` to `activities Activity[]`

**Step 4: Update HabitStack model**

```prisma
model HabitStack {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  activityIds String[] // CHANGED: from activities (SubCategory strings) to Activity IDs
  cueType     CueType?
  cueValue    String?
  isPreset    Boolean  @default(false)
  presetKey   String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Step 5: Update DailyScore model**

Add new fields:
```prisma
model DailyScore {
  // ... existing fields ...

  // NEW: Points tracking
  bodyPoints     Int       @default(0)  // Total points (can exceed 100)
  mindPoints     Int       @default(0)
  bodyComplete   Boolean   @default(false)  // Hit 100?
  mindComplete   Boolean   @default(false)
}
```

**Step 6: Remove SubCategory enum**

Delete the `SubCategory` enum entirely (we're using strings now).

**Step 7: Generate migration**

Run: `npx prisma migrate dev --name rename_habit_to_activity`
Expected: Migration created successfully

**Step 8: Verify migration**

Run: `npx prisma generate`
Expected: Prisma Client generated

**Step 9: Commit**

```bash
git add prisma/
git commit -m "feat: rename Habit to Activity, add isHabit flag and points tracking

- Rename Habit model to Activity
- Rename HabitCompletion to ActivityCompletion
- Change subCategory from enum to string (supports custom)
- Add isHabit boolean for recurring vs one-time
- Add pointsEarned to completions
- Update HabitStack to reference activityIds
- Add bodyPoints, mindPoints, bodyComplete, mindComplete to DailyScore

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create Predefined SubCategories Helper

**Files:**
- Create: `src/lib/subcategories.ts`

**Step 1: Write the test file**

Create `src/lib/__tests__/subcategories.test.ts`:
```typescript
import {
  PREDEFINED_SUBCATEGORIES,
  isPredefined,
  getSubcategoryPillar,
  getSubcategoryConfig,
} from '../subcategories';

describe('subcategories', () => {
  describe('isPredefined', () => {
    it('returns true for TRAINING', () => {
      expect(isPredefined('TRAINING')).toBe(true);
    });

    it('returns true for lowercase training', () => {
      expect(isPredefined('training')).toBe(true);
    });

    it('returns false for custom subcategory', () => {
      expect(isPredefined('YOGA')).toBe(false);
    });
  });

  describe('getSubcategoryPillar', () => {
    it('returns BODY for TRAINING', () => {
      expect(getSubcategoryPillar('TRAINING')).toBe('BODY');
    });

    it('returns MIND for MEDITATION', () => {
      expect(getSubcategoryPillar('MEDITATION')).toBe('MIND');
    });

    it('returns null for custom', () => {
      expect(getSubcategoryPillar('YOGA')).toBeNull();
    });
  });

  describe('getSubcategoryConfig', () => {
    it('returns config for TRAINING', () => {
      const config = getSubcategoryConfig('TRAINING');
      expect(config).toMatchObject({
        key: 'TRAINING',
        label: 'Training',
        pillar: 'BODY',
        hasWhoopIntegration: true,
      });
    });

    it('returns null for custom', () => {
      expect(getSubcategoryConfig('YOGA')).toBeNull();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/__tests__/subcategories.test.ts`
Expected: FAIL - module not found

**Step 3: Write the implementation**

Create `src/lib/subcategories.ts`:
```typescript
export const PREDEFINED_SUBCATEGORIES = {
  BODY: ['TRAINING', 'SLEEP', 'NUTRITION'] as const,
  MIND: ['MEDITATION', 'READING', 'LEARNING', 'JOURNALING'] as const,
};

export type PredefinedBodySubcategory = typeof PREDEFINED_SUBCATEGORIES.BODY[number];
export type PredefinedMindSubcategory = typeof PREDEFINED_SUBCATEGORIES.MIND[number];
export type PredefinedSubcategory = PredefinedBodySubcategory | PredefinedMindSubcategory;

export interface SubcategoryConfig {
  key: string;
  label: string;
  pillar: 'BODY' | 'MIND';
  icon: string; // SVG path
  color: string;
  hasWhoopIntegration: boolean;
}

const SUBCATEGORY_CONFIGS: Record<PredefinedSubcategory, SubcategoryConfig> = {
  TRAINING: {
    key: 'TRAINING',
    label: 'Training',
    pillar: 'BODY',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    color: '#EF4444',
    hasWhoopIntegration: true,
  },
  SLEEP: {
    key: 'SLEEP',
    label: 'Sleep',
    pillar: 'BODY',
    icon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
    color: '#6366F1',
    hasWhoopIntegration: true,
  },
  NUTRITION: {
    key: 'NUTRITION',
    label: 'Nutrition',
    pillar: 'BODY',
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    color: '#22C55E',
    hasWhoopIntegration: false,
  },
  MEDITATION: {
    key: 'MEDITATION',
    label: 'Meditation',
    pillar: 'MIND',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#8B5CF6',
    hasWhoopIntegration: false,
  },
  READING: {
    key: 'READING',
    label: 'Reading',
    pillar: 'MIND',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    color: '#F59E0B',
    hasWhoopIntegration: false,
  },
  LEARNING: {
    key: 'LEARNING',
    label: 'Learning',
    pillar: 'MIND',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    color: '#06B6D4',
    hasWhoopIntegration: false,
  },
  JOURNALING: {
    key: 'JOURNALING',
    label: 'Journaling',
    pillar: 'MIND',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    color: '#EC4899',
    hasWhoopIntegration: false,
  },
};

const ALL_PREDEFINED = [
  ...PREDEFINED_SUBCATEGORIES.BODY,
  ...PREDEFINED_SUBCATEGORIES.MIND,
];

export function isPredefined(subCategory: string): boolean {
  return ALL_PREDEFINED.includes(subCategory.toUpperCase() as PredefinedSubcategory);
}

export function getSubcategoryPillar(subCategory: string): 'BODY' | 'MIND' | null {
  const upper = subCategory.toUpperCase();
  if (PREDEFINED_SUBCATEGORIES.BODY.includes(upper as PredefinedBodySubcategory)) {
    return 'BODY';
  }
  if (PREDEFINED_SUBCATEGORIES.MIND.includes(upper as PredefinedMindSubcategory)) {
    return 'MIND';
  }
  return null;
}

export function getSubcategoryConfig(subCategory: string): SubcategoryConfig | null {
  const upper = subCategory.toUpperCase() as PredefinedSubcategory;
  return SUBCATEGORY_CONFIGS[upper] ?? null;
}

export function getSubcategoriesForPillar(pillar: 'BODY' | 'MIND'): readonly string[] {
  return PREDEFINED_SUBCATEGORIES[pillar];
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/__tests__/subcategories.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/subcategories.ts src/lib/__tests__/subcategories.test.ts
git commit -m "feat: add subcategories helper with predefined configs

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Points Calculation Library

**Files:**
- Create: `src/lib/points.ts`
- Create: `src/lib/__tests__/points.test.ts`

**Step 1: Write the test file**

```typescript
import { calculateDailyPoints, isPillarComplete, POINTS_THRESHOLD } from '../points';

describe('points', () => {
  describe('calculateDailyPoints', () => {
    it('sums points from completions', () => {
      const completions = [
        { pointsEarned: 30, activity: { pillar: 'BODY' } },
        { pointsEarned: 25, activity: { pillar: 'BODY' } },
      ];
      expect(calculateDailyPoints(completions as any, 'BODY')).toBe(55);
    });

    it('filters by pillar', () => {
      const completions = [
        { pointsEarned: 30, activity: { pillar: 'BODY' } },
        { pointsEarned: 25, activity: { pillar: 'MIND' } },
      ];
      expect(calculateDailyPoints(completions as any, 'BODY')).toBe(30);
      expect(calculateDailyPoints(completions as any, 'MIND')).toBe(25);
    });

    it('returns 0 for empty completions', () => {
      expect(calculateDailyPoints([], 'BODY')).toBe(0);
    });
  });

  describe('isPillarComplete', () => {
    it('returns true when points >= 100', () => {
      expect(isPillarComplete(100)).toBe(true);
      expect(isPillarComplete(150)).toBe(true);
    });

    it('returns false when points < 100', () => {
      expect(isPillarComplete(99)).toBe(false);
      expect(isPillarComplete(0)).toBe(false);
    });
  });

  describe('POINTS_THRESHOLD', () => {
    it('is 100', () => {
      expect(POINTS_THRESHOLD).toBe(100);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/__tests__/points.test.ts`
Expected: FAIL - module not found

**Step 3: Write the implementation**

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/__tests__/points.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/points.ts src/lib/__tests__/points.test.ts
git commit -m "feat: add points calculation library

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update API Routes - Rename Habits to Activities

**Files:**
- Create: `src/app/api/v1/activities/route.ts`
- Create: `src/app/api/v1/activities/[id]/route.ts`
- Create: `src/app/api/v1/activities/[id]/complete/route.ts`
- Modify: `src/app/api/v1/daily-status/route.ts`

**Step 1: Create activities list/create route**

Create `src/app/api/v1/activities/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pillar = searchParams.get('pillar');
    const subCategory = searchParams.get('subCategory');
    const habitsOnly = searchParams.get('habitsOnly') === 'true';

    const where: any = {
      userId: user.id,
      archived: false,
    };

    if (pillar) where.pillar = pillar;
    if (subCategory) where.subCategory = subCategory.toUpperCase();
    if (habitsOnly) where.isHabit = true;

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: activities });
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, pillar, subCategory, points = 25, isHabit = false, description } = body;

    if (!name || !pillar || !subCategory) {
      return NextResponse.json(
        { error: 'name, pillar, and subCategory are required' },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        name,
        pillar,
        subCategory: subCategory.toUpperCase(),
        points,
        isHabit,
        description,
        userId: user.id,
      },
    });

    return NextResponse.json({ data: activity }, { status: 201 });
  } catch (error) {
    console.error('Failed to create activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 2: Create activity complete route**

Create `src/app/api/v1/activities/[id]/complete/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activity = await prisma.activity.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { details, source = 'MANUAL' } = body;

    const completion = await prisma.activityCompletion.create({
      data: {
        activityId: activity.id,
        pointsEarned: activity.points,
        details,
        source,
      },
    });

    return NextResponse.json({ data: completion }, { status: 201 });
  } catch (error) {
    console.error('Failed to complete activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 3: Update daily-status to use new points calculation**

Modify `src/app/api/v1/daily-status/route.ts` to:
- Query ActivityCompletion instead of HabitCompletion
- Calculate points per pillar using `calculateDailyPoints`
- Return `bodyPoints`, `mindPoints`, `bodyComplete`, `mindComplete`

**Step 4: Commit**

```bash
git add src/app/api/v1/activities/
git commit -m "feat: add activities API routes

- GET /api/v1/activities - list activities with filters
- POST /api/v1/activities - create new activity
- POST /api/v1/activities/[id]/complete - log completion

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create Training Dashboard Component

**Files:**
- Create: `src/components/subcategories/TrainingDashboard.tsx`

**Step 1: Create the component**

```typescript
'use client';

import { motion } from 'framer-motion';
import { TrainingCard } from '@/components/whoop';

interface Workout {
  name: string;
  strain: number;
  duration: number;
  calories: number;
}

interface TrainingData {
  strain: number;
  calories: number;
  workouts: Workout[];
}

interface Activity {
  id: string;
  name: string;
  completedAt: string;
  pointsEarned: number;
}

interface TrainingDashboardProps {
  whoopData: TrainingData | null;
  activities: Activity[];
  totalPoints: number;
}

export function TrainingDashboard({ whoopData, activities, totalPoints }: TrainingDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Whoop Training Card */}
      {whoopData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TrainingCard data={whoopData} />
        </motion.div>
      )}

      {/* Points Summary */}
      <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Training Points</span>
          <span className="text-xl font-bold text-orange-400">{totalPoints} pts</span>
        </div>
      </div>

      {/* Today's Activities */}
      {activities.length > 0 && (
        <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5">
          <h3 className="text-sm font-medium text-text-muted mb-3">Today's Training</h3>
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <span className="text-text-primary">{activity.name}</span>
                <span className="text-sm text-orange-400">+{activity.pointsEarned}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!whoopData && activities.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-text-muted">No training logged yet</p>
          <p className="text-text-muted text-sm mt-1">Log a workout to see it here</p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/subcategories/TrainingDashboard.tsx
git commit -m "feat: add TrainingDashboard component with Whoop integration

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create Sleep Dashboard Component

**Files:**
- Create: `src/components/subcategories/SleepDashboard.tsx`

**Step 1: Create the component**

```typescript
'use client';

import { motion } from 'framer-motion';
import { SleepCard } from '@/components/whoop';

interface SleepData {
  hours: number;
  efficiency: number;
  remHours: number;
  deepHours: number;
  performance: number;
}

interface Activity {
  id: string;
  name: string;
  completedAt: string;
  pointsEarned: number;
}

interface SleepDashboardProps {
  whoopData: SleepData | null;
  activities: Activity[];
  totalPoints: number;
}

export function SleepDashboard({ whoopData, activities, totalPoints }: SleepDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Whoop Sleep Card */}
      {whoopData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SleepCard data={whoopData} />
        </motion.div>
      )}

      {/* Points Summary */}
      <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Sleep Points</span>
          <span className="text-xl font-bold text-indigo-400">{totalPoints} pts</span>
        </div>
      </div>

      {/* Today's Sleep Activities */}
      {activities.length > 0 && (
        <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5">
          <h3 className="text-sm font-medium text-text-muted mb-3">Sleep Activities</h3>
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <span className="text-text-primary">{activity.name}</span>
                <span className="text-sm text-indigo-400">+{activity.pointsEarned}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!whoopData && activities.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <p className="text-text-muted">No sleep data yet</p>
          <p className="text-text-muted text-sm mt-1">Connect Whoop or log sleep manually</p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/subcategories/SleepDashboard.tsx
git commit -m "feat: add SleepDashboard component with Whoop integration

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Create Remaining Dashboard Components

**Files:**
- Create: `src/components/subcategories/NutritionDashboard.tsx`
- Create: `src/components/subcategories/MeditationDashboard.tsx`
- Create: `src/components/subcategories/ReadingDashboard.tsx`
- Create: `src/components/subcategories/LearningDashboard.tsx`
- Create: `src/components/subcategories/JournalingDashboard.tsx`
- Create: `src/components/subcategories/CustomDashboard.tsx`
- Create: `src/components/subcategories/index.ts`

Each follows similar pattern to TrainingDashboard but with appropriate icons, colors, and empty states. CustomDashboard is a generic version for user-created subcategories.

**Step 1: Create all dashboard components**

(Each component follows the pattern established in Tasks 5-6)

**Step 2: Create index barrel export**

```typescript
export { TrainingDashboard } from './TrainingDashboard';
export { SleepDashboard } from './SleepDashboard';
export { NutritionDashboard } from './NutritionDashboard';
export { MeditationDashboard } from './MeditationDashboard';
export { ReadingDashboard } from './ReadingDashboard';
export { LearningDashboard } from './LearningDashboard';
export { JournalingDashboard } from './JournalingDashboard';
export { CustomDashboard } from './CustomDashboard';
```

**Step 3: Commit**

```bash
git add src/components/subcategories/
git commit -m "feat: add all subcategory dashboard components

- NutritionDashboard
- MeditationDashboard
- ReadingDashboard
- LearningDashboard
- JournalingDashboard
- CustomDashboard (generic for user-created)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Create SubCategory Tabs Component

**Files:**
- Create: `src/components/subcategories/SubCategoryTabs.tsx`

**Step 1: Create the component**

```typescript
'use client';

import { motion } from 'framer-motion';
import { getSubcategoryConfig, getSubcategoriesForPillar } from '@/lib/subcategories';

interface SubCategoryTabsProps {
  pillar: 'BODY' | 'MIND';
  selectedCategory: string;
  customCategories: string[];
  onSelect: (category: string) => void;
  onAddCustom: () => void;
}

export function SubCategoryTabs({
  pillar,
  selectedCategory,
  customCategories,
  onSelect,
  onAddCustom,
}: SubCategoryTabsProps) {
  const predefined = getSubcategoriesForPillar(pillar);
  const allCategories = [...predefined, ...customCategories];
  const pillarColor = pillar === 'BODY' ? '#E8A854' : '#7C9EE9';

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {allCategories.map((category) => {
        const config = getSubcategoryConfig(category);
        const isSelected = selectedCategory === category;
        const label = config?.label ?? category;

        return (
          <motion.button
            key={category}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              isSelected
                ? 'text-background'
                : 'bg-surface-light text-text-secondary hover:text-text-primary'
            }`}
            style={isSelected ? { backgroundColor: config?.color ?? pillarColor } : {}}
          >
            {label}
          </motion.button>
        );
      })}

      {/* Add Custom Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAddCustom}
        className="px-3 py-2 rounded-full text-sm font-medium bg-surface-light text-text-muted hover:text-text-primary transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </motion.button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/subcategories/SubCategoryTabs.tsx
git commit -m "feat: add SubCategoryTabs component for pillar navigation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Create Activity Quick-Log Component

**Files:**
- Create: `src/components/activities/QuickLogChips.tsx`

**Step 1: Create the component**

```typescript
'use client';

import { motion } from 'framer-motion';

interface Activity {
  id: string;
  name: string;
  points: number;
  subCategory: string;
}

interface QuickLogChipsProps {
  activities: Activity[]; // isHabit = true activities
  onLog: (activityId: string) => void;
  isLogging: string | null; // ID of activity being logged
}

export function QuickLogChips({ activities, onLog, isLogging }: QuickLogChipsProps) {
  if (activities.length === 0) return null;

  return (
    <div className="bg-surface/60 backdrop-blur-lg rounded-2xl p-4 border border-white/5">
      <h3 className="text-sm font-medium text-text-muted mb-3">Quick Log</h3>
      <div className="flex flex-wrap gap-2">
        {activities.map((activity) => (
          <motion.button
            key={activity.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onLog(activity.id)}
            disabled={isLogging === activity.id}
            className="px-3 py-1.5 rounded-full text-sm bg-surface-light text-text-secondary hover:text-text-primary hover:bg-surface-lighter transition-colors disabled:opacity-50"
          >
            {isLogging === activity.id ? (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Logging...
              </span>
            ) : (
              <>
                {activity.name}
                <span className="text-text-muted ml-1">+{activity.points}</span>
              </>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/activities/QuickLogChips.tsx
git commit -m "feat: add QuickLogChips for one-tap habit logging

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Update Body Page with New UI

**Files:**
- Modify: `src/app/(dashboard)/body/page.tsx`

**Step 1: Rewrite body page with tabbed subcategory UI**

- Add state for selected subcategory (default: 'TRAINING')
- Add state for custom subcategories (fetched from user's activities)
- Fetch activities filtered by pillar=BODY
- Display SubCategoryTabs component
- Conditionally render specialized dashboard based on selected tab
- Show QuickLogChips for isHabit=true activities
- Update score ring to show points/100
- Add streak display

**Step 2: Test the page**

Run: `npm run dev`
Navigate to /body and verify:
- Tabs show Training, Sleep, Nutrition
- Clicking tab switches dashboard
- Points display updates
- Quick log works

**Step 3: Commit**

```bash
git add src/app/(dashboard)/body/page.tsx
git commit -m "feat: update Body page with tabbed subcategory UI

- Add subcategory tabs (Training, Sleep, Nutrition + custom)
- Show specialized dashboard per tab
- Display points progress (X/100)
- Add quick-log chips for habits
- Integrate Whoop data per subcategory

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update Mind Page with New UI

**Files:**
- Modify: `src/app/(dashboard)/mind/page.tsx`

**Step 1: Apply same pattern as Body page**

- Subcategory tabs: Meditation, Reading, Learning, Journaling + custom
- Specialized dashboards per tab
- Points progress display
- Quick-log chips
- Mind color scheme (#7C9EE9)

**Step 2: Test the page**

Run: `npm run dev`
Navigate to /mind and verify same functionality as Body.

**Step 3: Commit**

```bash
git add src/app/(dashboard)/mind/page.tsx
git commit -m "feat: update Mind page with tabbed subcategory UI

- Add subcategory tabs (Meditation, Reading, Learning, Journaling + custom)
- Show specialized dashboard per tab
- Display points progress (X/100)
- Add quick-log chips for habits

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Create Add Custom SubCategory Modal

**Files:**
- Create: `src/components/subcategories/AddSubCategoryModal.tsx`

**Step 1: Create the modal component**

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddSubCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
  pillar: 'BODY' | 'MIND';
}

export function AddSubCategoryModal({ isOpen, onClose, onAdd, pillar }: AddSubCategoryModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    await onAdd(name.trim().toUpperCase());
    setName('');
    setIsSubmitting(false);
    onClose();
  };

  const pillarColor = pillar === 'BODY' ? '#E8A854' : '#7C9EE9';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-surface rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-text-primary mb-4">
                Add Custom Category
              </h2>

              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Yoga, Breathwork, Podcasts"
                  className="w-full px-4 py-3 bg-surface-light rounded-xl text-text-primary placeholder:text-text-muted border border-white/5 focus:border-white/20 focus:outline-none"
                  autoFocus
                />

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 text-text-muted bg-surface-light rounded-xl hover:bg-surface-lighter transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim() || isSubmitting}
                    className="flex-1 px-4 py-3 text-background rounded-xl font-medium disabled:opacity-50 transition-colors"
                    style={{ backgroundColor: pillarColor }}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/subcategories/AddSubCategoryModal.tsx
git commit -m "feat: add AddSubCategoryModal for custom categories

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Update Activity Log Modal

**Files:**
- Modify: `src/components/activities/ActivityLogModal.tsx`

**Step 1: Update modal to support new Activity model**

- Add subcategory selector (dropdown with predefined + custom options)
- Add points input (default 25)
- Add isHabit toggle ("Save as recurring habit")
- Update API call to POST /api/v1/activities + complete

**Step 2: Commit**

```bash
git add src/components/activities/ActivityLogModal.tsx
git commit -m "feat: update ActivityLogModal for new Activity model

- Add subcategory selector
- Add points input
- Add isHabit toggle
- Support custom subcategories

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 14: Update Streak Logic

**Files:**
- Modify: `src/lib/streaks.ts` (or create if doesn't exist)
- Modify: `src/app/api/v1/streaks/route.ts`

**Step 1: Update streak calculation**

```typescript
import { prisma } from '@/lib/prisma';
import { isPillarComplete } from './points';

export async function updateStreaksForDate(userId: string, date: Date) {
  const dailyScore = await prisma.dailyScore.findUnique({
    where: { userId_date: { userId, date } },
  });

  if (!dailyScore) return;

  // Update Body streak
  await updatePillarStreak(userId, 'BODY', dailyScore.bodyComplete, date);

  // Update Mind streak
  await updatePillarStreak(userId, 'MIND', dailyScore.mindComplete, date);

  // Update Overall streak (both must be complete)
  const overallComplete = dailyScore.bodyComplete && dailyScore.mindComplete;
  await updatePillarStreak(userId, 'OVERALL', overallComplete, date);
}

async function updatePillarStreak(
  userId: string,
  pillarKey: string,
  complete: boolean,
  date: Date
) {
  const streak = await prisma.streak.upsert({
    where: { userId_pillarKey: { userId, pillarKey } },
    create: { userId, pillarKey, current: 0, longest: 0 },
    update: {},
  });

  if (complete) {
    const newCurrent = streak.current + 1;
    await prisma.streak.update({
      where: { id: streak.id },
      data: {
        current: newCurrent,
        longest: Math.max(streak.longest, newCurrent),
        lastActiveDate: date,
      },
    });
  } else {
    // Check if streak should reset (missed yesterday)
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);

    if (streak.lastActiveDate && streak.lastActiveDate < yesterday) {
      await prisma.streak.update({
        where: { id: streak.id },
        data: { current: 0 },
      });
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/streaks.ts src/app/api/v1/streaks/
git commit -m "feat: update streak logic for points-based completion

- 100 points = streak maintained
- Separate streaks for Body, Mind, Overall
- Reset on missed day

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 15: Update HabitStack to Use Activity IDs

**Files:**
- Modify: `src/app/api/v1/stacks/route.ts`
- Modify: `src/app/api/v1/stacks/[id]/route.ts`
- Modify: any components using HabitStack

**Step 1: Update stack API to work with activityIds**

- Change from storing SubCategory strings to Activity IDs
- Update create/update logic
- Update stack execution to complete activities by ID

**Step 2: Commit**

```bash
git add src/app/api/v1/stacks/
git commit -m "feat: update HabitStack to reference Activity IDs

- Stack now chains activities, not subcategories
- Execute stack completes each activity in order

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 16: Clean Up Old Habit References

**Files:**
- Delete or update: Any remaining files referencing old Habit model
- Update: All imports to use Activity

**Step 1: Search for remaining Habit references**

Run: `grep -r "Habit" src/ --include="*.ts" --include="*.tsx"`

**Step 2: Update all references to Activity**

**Step 3: Remove deprecated Habit API routes if any**

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: clean up old Habit references, migrate to Activity

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 17: End-to-End Testing

**Step 1: Test full flow**

1. Create new activity (isHabit=false) → verify appears in list
2. Create habit (isHabit=true) → verify appears in quick-log
3. Complete activities until 100 pts → verify pillar shows complete
4. Check streak increments
5. Add custom subcategory → verify tab appears
6. Switch between tabs → verify correct dashboard shows
7. Test Whoop integration on Training/Sleep tabs

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add -A
git commit -m "test: verify Body/Mind optimization complete

- All subcategory dashboards working
- Points system functional
- Streaks updating correctly
- Custom categories supported

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

17 tasks total covering:
1. Schema migration (Habit → Activity)
2. Helper libraries (subcategories, points)
3. API routes for activities
4. 8 specialized dashboard components
5. UI components (tabs, quick-log, modals)
6. Body/Mind page updates
7. Streak logic updates
8. Stack updates
9. Cleanup and testing
