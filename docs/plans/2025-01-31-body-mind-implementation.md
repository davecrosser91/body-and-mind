# BODY & MIND Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the app into "BODY & MIND" with daily goal tracking, habit stacking, and full API access for AI assistant integration.

**Architecture:** Extend existing Prisma schema with new models (WeightConfig, HabitStack, Quote). Build REST API endpoints that expose all functionality. Enhance frontend with new home screen showing daily completion status and streak urgency.

**Tech Stack:** Next.js 14, Prisma, PostgreSQL, Framer Motion, Tailwind CSS, TypeScript

---

## Phase 1: Core Rebrand

### Task 1.1: Update App Name and Logo

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/components/ui/Logo.tsx`
- Modify: `public/` (favicon)

**Step 1: Create Logo component**

```tsx
// src/components/ui/Logo.tsx
'use client';

import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 32, showText = true, className = '' }: LogoProps) {
  const halfSize = size / 2;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Left half - Body (amber) */}
        <path
          d="M16 2 A14 14 0 0 0 16 30"
          fill="#E8A854"
        />
        {/* Right half - Mind (teal) */}
        <path
          d="M16 2 A14 14 0 0 1 16 30"
          fill="#5BCCB3"
        />
      </svg>
      {showText && (
        <span className="text-xl font-bold text-text-primary">
          BODY <span className="text-text-muted">&</span> MIND
        </span>
      )}
    </div>
  );
}
```

**Step 2: Update dashboard layout with new logo**

```tsx
// In src/app/(dashboard)/layout.tsx, replace the logo section:
import { Logo } from '@/components/ui/Logo';

// Replace:
<Link href="/dashboard" className="flex items-center gap-2 group">
  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-body to-mind flex items-center justify-center">
    <svg className="w-5 h-5 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  </div>
  <span className="text-xl font-bold text-text-primary group-hover:text-body transition-colors">
    Routine
  </span>
</Link>

// With:
<Link href="/dashboard">
  <Logo size={32} showText={true} />
</Link>
```

**Step 3: Update page title in root layout**

```tsx
// In src/app/layout.tsx, update metadata:
export const metadata: Metadata = {
  title: 'BODY & MIND',
  description: 'Every day, do something for your Body and Mind',
};
```

**Step 4: Commit**

```bash
git add src/components/ui/Logo.tsx src/app/(dashboard)/layout.tsx src/app/layout.tsx
git commit -m "rebrand: Update app name to BODY & MIND with new logo"
```

---

### Task 1.2: Create Motivational Quotes Database

**Files:**
- Create: `prisma/migrations/XXXX_add_quotes/migration.sql`
- Modify: `prisma/schema.prisma`
- Create: `src/lib/quotes.ts`
- Create: `prisma/seed-quotes.ts`

**Step 1: Add Quote model to schema**

```prisma
// Add to prisma/schema.prisma:

model Quote {
  id        String   @id @default(cuid())
  text      String
  author    String?
  category  QuoteCategory
  createdAt DateTime @default(now())
}

enum QuoteCategory {
  MOTIVATION
  CONSISTENCY
  BODY
  MIND
  BALANCE
  ATOMIC_HABITS
}
```

**Step 2: Run migration**

```bash
npx prisma migrate dev --name add_quotes
```

**Step 3: Create quotes utility**

```typescript
// src/lib/quotes.ts
import { prisma } from './db';
import { QuoteCategory } from '@prisma/client';

export async function getRandomQuote(category?: QuoteCategory): Promise<{ text: string; author: string | null }> {
  const where = category ? { category } : {};

  const count = await prisma.quote.count({ where });
  const skip = Math.floor(Math.random() * count);

  const quote = await prisma.quote.findFirst({
    where,
    skip,
  });

  return quote ?? { text: "Every day, do something for your Body and Mind.", author: null };
}

export async function getDailyQuote(userId: string): Promise<{ text: string; author: string | null }> {
  // Use date + userId as seed for consistent daily quote per user
  const today = new Date().toISOString().split('T')[0];
  const seed = `${userId}-${today}`;
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const count = await prisma.quote.count();
  const skip = hash % count;

  const quote = await prisma.quote.findFirst({ skip });

  return quote ?? { text: "Every day, do something for your Body and Mind.", author: null };
}
```

**Step 4: Create seed file with Atomic Habits quotes**

```typescript
// prisma/seed-quotes.ts
import { PrismaClient, QuoteCategory } from '@prisma/client';

const prisma = new PrismaClient();

const quotes = [
  // Atomic Habits
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear", category: QuoteCategory.ATOMIC_HABITS },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", category: QuoteCategory.ATOMIC_HABITS },
  { text: "Habits are the compound interest of self-improvement.", author: "James Clear", category: QuoteCategory.ATOMIC_HABITS },
  { text: "The task of breaking a bad habit is like uprooting a powerful oak within us.", author: "James Clear", category: QuoteCategory.ATOMIC_HABITS },
  { text: "Be the designer of your world and not merely the consumer of it.", author: "James Clear", category: QuoteCategory.ATOMIC_HABITS },
  { text: "Success is the product of daily habits—not once-in-a-lifetime transformations.", author: "James Clear", category: QuoteCategory.ATOMIC_HABITS },
  { text: "You should be far more concerned with your current trajectory than with your current results.", author: "James Clear", category: QuoteCategory.ATOMIC_HABITS },
  { text: "The most effective way to change your habits is to focus not on what you want to achieve, but on who you wish to become.", author: "James Clear", category: QuoteCategory.ATOMIC_HABITS },

  // Consistency
  { text: "Don't break the chain.", author: "Jerry Seinfeld", category: QuoteCategory.CONSISTENCY },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", category: QuoteCategory.CONSISTENCY },
  { text: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell", category: QuoteCategory.CONSISTENCY },
  { text: "It's not what we do once in a while that shapes our lives. It's what we do consistently.", author: "Tony Robbins", category: QuoteCategory.CONSISTENCY },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock", category: QuoteCategory.CONSISTENCY },

  // Motivation
  { text: "The only bad workout is the one that didn't happen.", author: null, category: QuoteCategory.MOTIVATION },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn", category: QuoteCategory.MOTIVATION },
  { text: "Your body hears everything your mind says.", author: "Naomi Judd", category: QuoteCategory.MOTIVATION },
  { text: "The mind is everything. What you think you become.", author: "Buddha", category: QuoteCategory.MOTIVATION },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi", category: QuoteCategory.MOTIVATION },

  // Body
  { text: "Physical fitness is the first requisite of happiness.", author: "Joseph Pilates", category: QuoteCategory.BODY },
  { text: "The body achieves what the mind believes.", author: null, category: QuoteCategory.BODY },
  { text: "Exercise is king. Nutrition is queen. Put them together and you've got a kingdom.", author: "Jack LaLanne", category: QuoteCategory.BODY },
  { text: "A healthy outside starts from the inside.", author: "Robert Urich", category: QuoteCategory.BODY },

  // Mind
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch", category: QuoteCategory.MIND },
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison", category: QuoteCategory.MIND },
  { text: "Meditation is not about stopping thoughts, but recognizing that we are more than our thoughts.", author: "Arianna Huffington", category: QuoteCategory.MIND },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", category: QuoteCategory.MIND },

  // Balance
  { text: "Balance is not something you find, it's something you create.", author: null, category: QuoteCategory.BALANCE },
  { text: "A fit body, a calm mind, a house full of love. These things cannot be bought.", author: "Naval Ravikant", category: QuoteCategory.BALANCE },
  { text: "Health is a state of complete harmony of the body, mind and spirit.", author: "B.K.S. Iyengar", category: QuoteCategory.BALANCE },
  { text: "To keep the body in good health is a duty, otherwise we shall not be able to keep our mind strong and clear.", author: "Buddha", category: QuoteCategory.BALANCE },
];

async function seed() {
  console.log('Seeding quotes...');

  for (const quote of quotes) {
    await prisma.quote.create({ data: quote });
  }

  console.log(`Seeded ${quotes.length} quotes`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Step 5: Run seed**

```bash
npx ts-node prisma/seed-quotes.ts
```

**Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/lib/quotes.ts prisma/seed-quotes.ts
git commit -m "feat: Add motivational quotes database with Atomic Habits quotes"
```

---

## Phase 2: Daily Goal System

### Task 2.1: Create Daily Status Model and API

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/lib/daily-status.ts`
- Create: `src/app/api/v1/daily-status/route.ts`

**Step 1: Add DailyGoal model to track completion**

```prisma
// Add to prisma/schema.prisma:

model DailyGoal {
  id            String   @id @default(cuid())
  userId        String
  date          DateTime @db.Date
  bodyCompleted Boolean  @default(false)
  mindCompleted Boolean  @default(false)
  bodyActivities String[] // Activity IDs
  mindActivities String[] // Activity IDs
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
}

// Add relation to User model:
// dailyGoals DailyGoal[]
```

**Step 2: Run migration**

```bash
npx prisma migrate dev --name add_daily_goal
```

**Step 3: Create daily status service**

```typescript
// src/lib/daily-status.ts
import { prisma } from './db';
import { getDailyQuote } from './quotes';
import { startOfDay } from 'date-fns';

export interface DailyStatus {
  date: string;
  body: {
    completed: boolean;
    score: number;
    activities: Array<{ id: string; name: string; category: string; completedAt: string }>;
  };
  mind: {
    completed: boolean;
    score: number;
    activities: Array<{ id: string; name: string; category: string; completedAt: string }>;
  };
  streak: {
    current: number;
    atRisk: boolean;
    hoursRemaining: number;
  };
  recovery: {
    score: number | null;
    zone: 'green' | 'yellow' | 'red' | null;
    recommendation: string | null;
  } | null;
  quote: {
    text: string;
    author: string | null;
  };
}

export async function getDailyStatus(userId: string): Promise<DailyStatus> {
  const today = startOfDay(new Date());
  const todayStr = today.toISOString().split('T')[0];

  // Get today's completions
  const completions = await prisma.habitCompletion.findMany({
    where: {
      habit: { userId },
      completedAt: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    include: {
      habit: true,
    },
  });

  // Separate by pillar
  const bodyActivities = completions
    .filter(c => c.habit.pillar === 'BODY')
    .map(c => ({
      id: c.id,
      name: c.habit.name,
      category: c.habit.subCategory ?? 'TRAINING',
      completedAt: c.completedAt.toISOString(),
    }));

  const mindActivities = completions
    .filter(c => c.habit.pillar === 'MIND')
    .map(c => ({
      id: c.id,
      name: c.habit.name,
      category: c.habit.subCategory ?? 'MEDITATION',
      completedAt: c.completedAt.toISOString(),
    }));

  const bodyCompleted = bodyActivities.length > 0;
  const mindCompleted = mindActivities.length > 0;

  // Get today's score
  const dailyScore = await prisma.dailyScore.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  // Get streak
  const streak = await prisma.streak.findUnique({
    where: { userId_pillarKey: { userId, pillarKey: 'OVERALL' } },
  });

  // Calculate hours remaining until midnight
  const now = new Date();
  const midnight = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const hoursRemaining = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60)));

  // Determine if streak is at risk
  const atRisk = (!bodyCompleted || !mindCompleted) && (streak?.currentStreak ?? 0) > 0;

  // Get recovery from Whoop (if connected)
  let recovery = null;
  const whoopConnection = await prisma.whoopConnection.findUnique({ where: { userId } });
  if (whoopConnection && dailyScore?.whoopRecovery) {
    const score = dailyScore.whoopRecovery;
    let zone: 'green' | 'yellow' | 'red';
    let recommendation: string;

    if (score >= 67) {
      zone = 'green';
      recommendation = 'Great recovery! Push hard today.';
    } else if (score >= 34) {
      zone = 'yellow';
      recommendation = 'Moderate recovery. Consider lighter activity.';
    } else {
      zone = 'red';
      recommendation = 'Low recovery. Focus on rest and Mind activities.';
    }

    recovery = { score, zone, recommendation };
  }

  // Get daily quote
  const quote = await getDailyQuote(userId);

  return {
    date: todayStr,
    body: {
      completed: bodyCompleted,
      score: dailyScore?.bodyScore ?? 0,
      activities: bodyActivities,
    },
    mind: {
      completed: mindCompleted,
      score: dailyScore?.mindScore ?? 0,
      activities: mindActivities,
    },
    streak: {
      current: streak?.currentStreak ?? 0,
      atRisk,
      hoursRemaining,
    },
    recovery,
    quote,
  };
}

export async function updateDailyGoal(userId: string): Promise<void> {
  const today = startOfDay(new Date());

  // Count completions by pillar
  const completions = await prisma.habitCompletion.findMany({
    where: {
      habit: { userId },
      completedAt: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    include: { habit: true },
  });

  const bodyActivities = completions.filter(c => c.habit.pillar === 'BODY').map(c => c.id);
  const mindActivities = completions.filter(c => c.habit.pillar === 'MIND').map(c => c.id);

  await prisma.dailyGoal.upsert({
    where: { userId_date: { userId, date: today } },
    create: {
      userId,
      date: today,
      bodyCompleted: bodyActivities.length > 0,
      mindCompleted: mindActivities.length > 0,
      bodyActivities,
      mindActivities,
    },
    update: {
      bodyCompleted: bodyActivities.length > 0,
      mindCompleted: mindActivities.length > 0,
      bodyActivities,
      mindActivities,
    },
  });
}
```

**Step 4: Create API endpoint**

```typescript
// src/app/api/v1/daily-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getDailyStatus } from '@/lib/daily-status';
import { successResponse, errorResponse } from '@/lib/api-response';

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const status = await getDailyStatus(userId);
    return successResponse(status);
  } catch (error) {
    console.error('Error getting daily status:', error);
    return errorResponse('Failed to get daily status', 500);
  }
});
```

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/lib/daily-status.ts src/app/api/v1/daily-status/
git commit -m "feat: Add daily status API with goal tracking"
```

---

### Task 2.2: Update Streak Logic for Combined Tracking

**Files:**
- Modify: `src/lib/streaks.ts`
- Create: `src/app/api/v1/streaks/route.ts`

**Step 1: Update streak service for combined Body+Mind tracking**

```typescript
// Replace content in src/lib/streaks.ts:
import { prisma } from './db';
import { startOfDay, subDays } from 'date-fns';

export type PillarKey = 'BODY' | 'MIND' | 'OVERALL';

export interface StreakInfo {
  current: number;
  longest: number;
  lastActiveDate: string | null;
  atRisk: boolean;
  hoursRemaining: number;
}

export async function getStreak(userId: string, pillarKey: PillarKey = 'OVERALL'): Promise<StreakInfo> {
  const streak = await prisma.streak.findUnique({
    where: { userId_pillarKey: { userId, pillarKey } },
  });

  const now = new Date();
  const today = startOfDay(now);
  const midnight = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const hoursRemaining = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60)));

  // Check if today is complete
  const todayComplete = await isDayComplete(userId, today, pillarKey);
  const atRisk = !todayComplete && (streak?.currentStreak ?? 0) > 0;

  return {
    current: streak?.currentStreak ?? 0,
    longest: streak?.longestStreak ?? 0,
    lastActiveDate: streak?.lastActiveDate?.toISOString().split('T')[0] ?? null,
    atRisk,
    hoursRemaining,
  };
}

async function isDayComplete(userId: string, date: Date, pillarKey: PillarKey): Promise<boolean> {
  const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);

  if (pillarKey === 'OVERALL') {
    // Both Body AND Mind must have at least one completion
    const bodyCount = await prisma.habitCompletion.count({
      where: {
        habit: { userId, pillar: 'BODY' },
        completedAt: { gte: date, lt: nextDay },
      },
    });

    const mindCount = await prisma.habitCompletion.count({
      where: {
        habit: { userId, pillar: 'MIND' },
        completedAt: { gte: date, lt: nextDay },
      },
    });

    return bodyCount > 0 && mindCount > 0;
  }

  // Single pillar check
  const count = await prisma.habitCompletion.count({
    where: {
      habit: { userId, pillar: pillarKey },
      completedAt: { gte: date, lt: nextDay },
    },
  });

  return count > 0;
}

export async function updateStreak(userId: string): Promise<void> {
  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);

  // Update all three streaks
  for (const pillarKey of ['BODY', 'MIND', 'OVERALL'] as PillarKey[]) {
    const todayComplete = await isDayComplete(userId, today, pillarKey);
    const yesterdayComplete = await isDayComplete(userId, yesterday, pillarKey);

    const existing = await prisma.streak.findUnique({
      where: { userId_pillarKey: { userId, pillarKey } },
    });

    let newCurrentStreak = existing?.currentStreak ?? 0;

    if (todayComplete) {
      // Check if this extends the streak or starts a new one
      const lastActive = existing?.lastActiveDate;
      const lastActiveDay = lastActive ? startOfDay(lastActive) : null;

      if (lastActiveDay?.getTime() === today.getTime()) {
        // Already counted today, no change
      } else if (lastActiveDay?.getTime() === yesterday.getTime() || yesterdayComplete) {
        // Streak continues
        newCurrentStreak += 1;
      } else {
        // Streak broken, start fresh
        newCurrentStreak = 1;
      }
    }

    const newLongestStreak = Math.max(existing?.longestStreak ?? 0, newCurrentStreak);

    await prisma.streak.upsert({
      where: { userId_pillarKey: { userId, pillarKey } },
      create: {
        userId,
        pillarKey,
        currentStreak: todayComplete ? newCurrentStreak : 0,
        longestStreak: newLongestStreak,
        lastActiveDate: todayComplete ? today : existing?.lastActiveDate,
      },
      update: {
        currentStreak: todayComplete ? newCurrentStreak : (existing?.lastActiveDate?.getTime() === today.getTime() ? newCurrentStreak : 0),
        longestStreak: newLongestStreak,
        lastActiveDate: todayComplete ? today : existing?.lastActiveDate,
      },
    });

    // Check for streak achievements
    if (todayComplete) {
      await checkStreakAchievements(userId, pillarKey, newCurrentStreak);
    }
  }
}

async function checkStreakAchievements(userId: string, pillarKey: PillarKey, streak: number): Promise<void> {
  const milestones = [3, 7, 14, 21, 30, 60, 66, 100, 365];

  for (const milestone of milestones) {
    if (streak >= milestone) {
      const type = `streak_${pillarKey.toLowerCase()}_${milestone}`;

      const existing = await prisma.achievement.findUnique({
        where: { userId_type: { userId, type } },
      });

      if (!existing) {
        await prisma.achievement.create({
          data: { userId, type },
        });
      }
    }
  }
}

export function getEmberIntensity(streakDays: number): 'dim' | 'steady' | 'bright' | 'golden' {
  if (streakDays >= 30) return 'golden';
  if (streakDays >= 14) return 'bright';
  if (streakDays >= 7) return 'steady';
  return 'dim';
}
```

**Step 2: Create streaks API endpoint**

```typescript
// src/app/api/v1/streaks/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getStreak, PillarKey } from '@/lib/streaks';
import { successResponse, errorResponse } from '@/lib/api-response';

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const { searchParams } = new URL(request.url);
    const pillar = (searchParams.get('pillar')?.toUpperCase() as PillarKey) || 'OVERALL';

    const streak = await getStreak(userId, pillar);

    return successResponse({
      pillar,
      ...streak,
    });
  } catch (error) {
    console.error('Error getting streak:', error);
    return errorResponse('Failed to get streak', 500);
  }
});
```

**Step 3: Commit**

```bash
git add src/lib/streaks.ts src/app/api/v1/streaks/
git commit -m "feat: Update streak logic for combined Body+Mind tracking"
```

---

## Phase 3: Weight Configuration System

### Task 3.1: Create Weight Config Model and API

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/lib/weights.ts`
- Create: `src/app/api/v1/weights/route.ts`

**Step 1: Add WeightConfig model**

```prisma
// Add to prisma/schema.prisma:

model WeightConfig {
  id        String @id @default(cuid())
  userId    String @unique
  preset    WeightPreset @default(BALANCED)

  // Body weights (must sum to 100)
  trainingWeight  Int @default(35)
  sleepWeight     Int @default(35)
  nutritionWeight Int @default(30)

  // Mind weights (must sum to 100)
  meditationWeight Int @default(40)
  readingWeight    Int @default(30)
  learningWeight   Int @default(30)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum WeightPreset {
  BALANCED
  ATHLETE
  RECOVERY
  KNOWLEDGE
  CUSTOM
}

// Add relation to User model:
// weightConfig WeightConfig?
```

**Step 2: Run migration**

```bash
npx prisma migrate dev --name add_weight_config
```

**Step 3: Create weights service**

```typescript
// src/lib/weights.ts
import { prisma } from './db';
import { WeightPreset } from '@prisma/client';

export interface Weights {
  preset: WeightPreset;
  body: {
    training: number;
    sleep: number;
    nutrition: number;
  };
  mind: {
    meditation: number;
    reading: number;
    learning: number;
  };
}

const PRESETS: Record<WeightPreset, Omit<Weights, 'preset'>> = {
  BALANCED: {
    body: { training: 35, sleep: 35, nutrition: 30 },
    mind: { meditation: 40, reading: 30, learning: 30 },
  },
  ATHLETE: {
    body: { training: 50, sleep: 35, nutrition: 15 },
    mind: { meditation: 50, reading: 25, learning: 25 },
  },
  RECOVERY: {
    body: { training: 20, sleep: 50, nutrition: 30 },
    mind: { meditation: 50, reading: 30, learning: 20 },
  },
  KNOWLEDGE: {
    body: { training: 30, sleep: 40, nutrition: 30 },
    mind: { meditation: 20, reading: 40, learning: 40 },
  },
  CUSTOM: {
    body: { training: 35, sleep: 35, nutrition: 30 },
    mind: { meditation: 40, reading: 30, learning: 30 },
  },
};

export async function getWeights(userId: string): Promise<Weights> {
  const config = await prisma.weightConfig.findUnique({
    where: { userId },
  });

  if (!config) {
    return { preset: 'BALANCED', ...PRESETS.BALANCED };
  }

  return {
    preset: config.preset,
    body: {
      training: config.trainingWeight,
      sleep: config.sleepWeight,
      nutrition: config.nutritionWeight,
    },
    mind: {
      meditation: config.meditationWeight,
      reading: config.readingWeight,
      learning: config.learningWeight,
    },
  };
}

export async function setWeights(
  userId: string,
  preset: WeightPreset,
  body?: { training: number; sleep: number; nutrition: number },
  mind?: { meditation: number; reading: number; learning: number }
): Promise<Weights> {
  // If preset is not CUSTOM, use preset values
  const presetValues = PRESETS[preset];
  const bodyWeights = preset === 'CUSTOM' && body ? body : presetValues.body;
  const mindWeights = preset === 'CUSTOM' && mind ? mind : presetValues.mind;

  // Validate sums
  const bodySum = bodyWeights.training + bodyWeights.sleep + bodyWeights.nutrition;
  const mindSum = mindWeights.meditation + mindWeights.reading + mindWeights.learning;

  if (bodySum !== 100 || mindSum !== 100) {
    throw new Error('Weights must sum to 100 for each pillar');
  }

  const config = await prisma.weightConfig.upsert({
    where: { userId },
    create: {
      userId,
      preset,
      trainingWeight: bodyWeights.training,
      sleepWeight: bodyWeights.sleep,
      nutritionWeight: bodyWeights.nutrition,
      meditationWeight: mindWeights.meditation,
      readingWeight: mindWeights.reading,
      learningWeight: mindWeights.learning,
    },
    update: {
      preset,
      trainingWeight: bodyWeights.training,
      sleepWeight: bodyWeights.sleep,
      nutritionWeight: bodyWeights.nutrition,
      meditationWeight: mindWeights.meditation,
      readingWeight: mindWeights.reading,
      learningWeight: mindWeights.learning,
    },
  });

  return {
    preset: config.preset,
    body: {
      training: config.trainingWeight,
      sleep: config.sleepWeight,
      nutrition: config.nutritionWeight,
    },
    mind: {
      meditation: config.meditationWeight,
      reading: config.readingWeight,
      learning: config.learningWeight,
    },
  };
}

export function getPresetWeights(preset: WeightPreset): Omit<Weights, 'preset'> {
  return PRESETS[preset];
}
```

**Step 4: Create weights API endpoint**

```typescript
// src/app/api/v1/weights/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getWeights, setWeights, getPresetWeights } from '@/lib/weights';
import { successResponse, errorResponse } from '@/lib/api-response';
import { WeightPreset } from '@prisma/client';

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const weights = await getWeights(userId);
    return successResponse(weights);
  } catch (error) {
    console.error('Error getting weights:', error);
    return errorResponse('Failed to get weights', 500);
  }
});

export const PUT = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const data = await request.json();
    const { preset, body, mind } = data;

    if (!preset || !Object.values(WeightPreset).includes(preset)) {
      return errorResponse('Invalid preset', 400);
    }

    const weights = await setWeights(userId, preset, body, mind);
    return successResponse(weights);
  } catch (error) {
    console.error('Error setting weights:', error);
    const message = error instanceof Error ? error.message : 'Failed to set weights';
    return errorResponse(message, 400);
  }
});
```

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/lib/weights.ts src/app/api/v1/weights/
git commit -m "feat: Add weight configuration system with presets"
```

---

## Phase 4: Habit Stacking System

### Task 4.1: Create Habit Stack Model and API

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/lib/habit-stacks.ts`
- Create: `src/app/api/v1/stacks/route.ts`
- Create: `src/app/api/v1/stacks/[id]/route.ts`

**Step 1: Add HabitStack model**

```prisma
// Add to prisma/schema.prisma:

model HabitStack {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  activities  String[] // SubCategory values in order
  cueType     CueType?
  cueValue    String?  // Time (HH:mm) or location name
  isPreset    Boolean  @default(false)
  presetKey   String?  // e.g., "morning_momentum"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum CueType {
  TIME
  LOCATION
  AFTER_ACTIVITY
}

// Add relation to User model:
// habitStacks HabitStack[]
```

**Step 2: Run migration**

```bash
npx prisma migrate dev --name add_habit_stacks
```

**Step 3: Create habit stacks service**

```typescript
// src/lib/habit-stacks.ts
import { prisma } from './db';
import { CueType, SubCategory } from '@prisma/client';

export interface HabitStack {
  id: string;
  name: string;
  description: string | null;
  activities: string[];
  cue: { type: CueType; value: string } | null;
  isPreset: boolean;
  isActive: boolean;
}

export interface CreateStackInput {
  name: string;
  description?: string;
  activities: string[];
  cueType?: CueType;
  cueValue?: string;
}

const PRESET_STACKS: Omit<HabitStack, 'id'>[] = [
  {
    name: 'Morning Momentum',
    description: 'Start your day strong with movement and mindfulness',
    activities: ['TRAINING', 'MEDITATION'],
    cue: { type: 'TIME' as CueType, value: '07:00' },
    isPreset: true,
    isActive: false,
  },
  {
    name: 'Evening Wind-Down',
    description: 'End your day with learning and reflection',
    activities: ['READING', 'JOURNALING'],
    cue: { type: 'TIME' as CueType, value: '21:00' },
    isPreset: true,
    isActive: false,
  },
  {
    name: 'The 2-Minute Start',
    description: 'Tiny habits to build consistency',
    activities: ['TRAINING', 'MEDITATION', 'READING'],
    cue: null,
    isPreset: true,
    isActive: false,
  },
  {
    name: 'Recovery Day',
    description: 'Focus on rest and mental growth',
    activities: ['SLEEP', 'MEDITATION', 'READING', 'LEARNING'],
    cue: null,
    isPreset: true,
    isActive: false,
  },
];

export async function getStacks(userId: string): Promise<HabitStack[]> {
  const stacks = await prisma.habitStack.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  return stacks.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    activities: s.activities,
    cue: s.cueType && s.cueValue ? { type: s.cueType, value: s.cueValue } : null,
    isPreset: s.isPreset,
    isActive: s.isActive,
  }));
}

export async function createStack(userId: string, input: CreateStackInput): Promise<HabitStack> {
  const stack = await prisma.habitStack.create({
    data: {
      userId,
      name: input.name,
      description: input.description,
      activities: input.activities,
      cueType: input.cueType,
      cueValue: input.cueValue,
    },
  });

  return {
    id: stack.id,
    name: stack.name,
    description: stack.description,
    activities: stack.activities,
    cue: stack.cueType && stack.cueValue ? { type: stack.cueType, value: stack.cueValue } : null,
    isPreset: stack.isPreset,
    isActive: stack.isActive,
  };
}

export async function updateStack(
  userId: string,
  stackId: string,
  input: Partial<CreateStackInput> & { isActive?: boolean }
): Promise<HabitStack> {
  const stack = await prisma.habitStack.update({
    where: { id: stackId, userId },
    data: {
      name: input.name,
      description: input.description,
      activities: input.activities,
      cueType: input.cueType,
      cueValue: input.cueValue,
      isActive: input.isActive,
    },
  });

  return {
    id: stack.id,
    name: stack.name,
    description: stack.description,
    activities: stack.activities,
    cue: stack.cueType && stack.cueValue ? { type: stack.cueType, value: stack.cueValue } : null,
    isPreset: stack.isPreset,
    isActive: stack.isActive,
  };
}

export async function deleteStack(userId: string, stackId: string): Promise<void> {
  await prisma.habitStack.delete({
    where: { id: stackId, userId },
  });
}

export async function initializePresetStacks(userId: string): Promise<void> {
  const existing = await prisma.habitStack.count({ where: { userId, isPreset: true } });

  if (existing === 0) {
    for (const preset of PRESET_STACKS) {
      await prisma.habitStack.create({
        data: {
          userId,
          name: preset.name,
          description: preset.description,
          activities: preset.activities,
          cueType: preset.cue?.type,
          cueValue: preset.cue?.value,
          isPreset: true,
          isActive: false,
        },
      });
    }
  }
}

export function getPresetStacks(): Omit<HabitStack, 'id'>[] {
  return PRESET_STACKS;
}
```

**Step 4: Create stacks API endpoints**

```typescript
// src/app/api/v1/stacks/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getStacks, createStack, initializePresetStacks } from '@/lib/habit-stacks';
import { successResponse, errorResponse } from '@/lib/api-response';

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    // Initialize presets if not exists
    await initializePresetStacks(userId);

    const stacks = await getStacks(userId);
    return successResponse({ stacks });
  } catch (error) {
    console.error('Error getting stacks:', error);
    return errorResponse('Failed to get stacks', 500);
  }
});

export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const data = await request.json();
    const { name, description, activities, cueType, cueValue } = data;

    if (!name || !activities || activities.length === 0) {
      return errorResponse('Name and activities are required', 400);
    }

    const stack = await createStack(userId, { name, description, activities, cueType, cueValue });
    return successResponse(stack, 201);
  } catch (error) {
    console.error('Error creating stack:', error);
    return errorResponse('Failed to create stack', 500);
  }
});
```

```typescript
// src/app/api/v1/stacks/[id]/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { updateStack, deleteStack } from '@/lib/habit-stacks';
import { successResponse, errorResponse } from '@/lib/api-response';

export const PUT = withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: { id: string } }
) => {
  try {
    const data = await request.json();
    const stack = await updateStack(userId, params.id, data);
    return successResponse(stack);
  } catch (error) {
    console.error('Error updating stack:', error);
    return errorResponse('Failed to update stack', 500);
  }
});

export const DELETE = withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: { id: string } }
) => {
  try {
    await deleteStack(userId, params.id);
    return successResponse({ deleted: true });
  } catch (error) {
    console.error('Error deleting stack:', error);
    return errorResponse('Failed to delete stack', 500);
  }
});
```

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/lib/habit-stacks.ts src/app/api/v1/stacks/
git commit -m "feat: Add habit stacking system with presets"
```

---

## Phase 5: Recommendations API

### Task 5.1: Create Recommendations Service and API

**Files:**
- Create: `src/lib/recommendations.ts`
- Create: `src/app/api/v1/recommendations/route.ts`

**Step 1: Create recommendations service**

```typescript
// src/lib/recommendations.ts
import { prisma } from './db';
import { getDailyStatus } from './daily-status';
import { getStacks } from './habit-stacks';
import { getDailyQuote } from './quotes';
import { SubCategory } from '@prisma/client';

export interface Recommendation {
  recovery: {
    score: number | null;
    zone: 'green' | 'yellow' | 'red' | null;
    suggestion: string;
    suggestedActivities: string[];
  };
  streakStatus: {
    current: number;
    atRisk: boolean;
    hoursRemaining: number;
    quickActions: Array<{ activity: string; label: string; duration: string }>;
  };
  nextInStack: {
    stackName: string;
    activity: string;
    afterCompleting: string | null;
  } | null;
  quote: {
    text: string;
    author: string | null;
  };
}

const QUICK_ACTIONS: Record<string, { label: string; duration: string }> = {
  TRAINING: { label: 'Quick stretch', duration: '2 min' },
  SLEEP: { label: 'Sleep log', duration: '1 min' },
  NUTRITION: { label: 'Log a meal', duration: '1 min' },
  MEDITATION: { label: 'Breathe', duration: '2 min' },
  READING: { label: 'Read 1 page', duration: '2 min' },
  LEARNING: { label: 'Quick lesson', duration: '5 min' },
  JOURNALING: { label: 'One thought', duration: '1 min' },
};

export async function getRecommendations(userId: string): Promise<Recommendation> {
  const status = await getDailyStatus(userId);
  const stacks = await getStacks(userId);
  const quote = await getDailyQuote(userId);

  // Recovery-based suggestions
  let recoveryData: Recommendation['recovery'];
  if (status.recovery) {
    const { score, zone } = status.recovery;
    let suggestion: string;
    let suggestedActivities: string[];

    if (zone === 'green') {
      suggestion = 'Great recovery! Push yourself today.';
      suggestedActivities = ['TRAINING', 'LEARNING'];
    } else if (zone === 'yellow') {
      suggestion = 'Moderate recovery. Balance intensity.';
      suggestedActivities = ['TRAINING', 'MEDITATION', 'READING'];
    } else {
      suggestion = 'Rest day recommended. Focus on Mind.';
      suggestedActivities = ['MEDITATION', 'READING', 'SLEEP'];
    }

    recoveryData = { score, zone, suggestion, suggestedActivities };
  } else {
    recoveryData = {
      score: null,
      zone: null,
      suggestion: 'Connect Whoop for personalized recommendations.',
      suggestedActivities: ['TRAINING', 'MEDITATION'],
    };
  }

  // Quick actions based on what's missing
  const quickActions: Recommendation['streakStatus']['quickActions'] = [];

  if (!status.body.completed) {
    quickActions.push({ activity: 'TRAINING', ...QUICK_ACTIONS.TRAINING });
    quickActions.push({ activity: 'NUTRITION', ...QUICK_ACTIONS.NUTRITION });
  }

  if (!status.mind.completed) {
    quickActions.push({ activity: 'MEDITATION', ...QUICK_ACTIONS.MEDITATION });
    quickActions.push({ activity: 'READING', ...QUICK_ACTIONS.READING });
  }

  // Find next activity in active stack
  let nextInStack: Recommendation['nextInStack'] = null;
  const activeStacks = stacks.filter(s => s.isActive);

  if (activeStacks.length > 0) {
    const todayActivities = [
      ...status.body.activities.map(a => a.category),
      ...status.mind.activities.map(a => a.category),
    ];

    for (const stack of activeStacks) {
      for (let i = 0; i < stack.activities.length; i++) {
        const activity = stack.activities[i];
        if (!todayActivities.includes(activity)) {
          nextInStack = {
            stackName: stack.name,
            activity,
            afterCompleting: i > 0 ? stack.activities[i - 1] : null,
          };
          break;
        }
      }
      if (nextInStack) break;
    }
  }

  return {
    recovery: recoveryData,
    streakStatus: {
      current: status.streak.current,
      atRisk: status.streak.atRisk,
      hoursRemaining: status.streak.hoursRemaining,
      quickActions,
    },
    nextInStack,
    quote,
  };
}
```

**Step 2: Create recommendations API endpoint**

```typescript
// src/app/api/v1/recommendations/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getRecommendations } from '@/lib/recommendations';
import { successResponse, errorResponse } from '@/lib/api-response';

export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const recommendations = await getRecommendations(userId);
    return successResponse(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return errorResponse('Failed to get recommendations', 500);
  }
});
```

**Step 3: Commit**

```bash
git add src/lib/recommendations.ts src/app/api/v1/recommendations/
git commit -m "feat: Add recommendations API with recovery-aware suggestions"
```

---

## Phase 6: Activity Logging API

### Task 6.1: Create Activity Logging Endpoint

**Files:**
- Create: `src/app/api/v1/activities/route.ts`
- Modify: `src/lib/habit-completion.ts`

**Step 1: Enhance habit completion service**

```typescript
// Add to src/lib/habit-completion.ts:

export interface LogActivityInput {
  pillar: 'BODY' | 'MIND';
  category: string; // SubCategory
  duration?: number; // minutes
  details?: string;
  source?: 'manual' | 'whoop' | 'api';
}

export async function logActivity(userId: string, input: LogActivityInput): Promise<{
  habitId: string;
  completionId: string;
  isNew: boolean;
}> {
  // Find or create a habit for this category
  let habit = await prisma.habit.findFirst({
    where: {
      userId,
      pillar: input.pillar,
      subCategory: input.category as any,
    },
  });

  let isNew = false;

  if (!habit) {
    // Create a default habit for this category
    const categoryNames: Record<string, string> = {
      TRAINING: 'Workout',
      SLEEP: 'Sleep',
      NUTRITION: 'Healthy Eating',
      MEDITATION: 'Meditation',
      READING: 'Reading',
      LEARNING: 'Learning',
      JOURNALING: 'Journaling',
    };

    habit = await prisma.habit.create({
      data: {
        userId,
        name: categoryNames[input.category] || input.category,
        pillar: input.pillar,
        subCategory: input.category as any,
        frequency: 'DAILY',
      },
    });
    isNew = true;
  }

  // Create completion
  const completion = await prisma.habitCompletion.create({
    data: {
      habitId: habit.id,
      details: JSON.stringify({
        duration: input.duration,
        notes: input.details,
        source: input.source || 'api',
      }),
      source: input.source === 'whoop' ? 'WHOOP' : 'MANUAL',
    },
  });

  // Update streak
  const { updateStreak } = await import('./streaks');
  await updateStreak(userId);

  // Update daily goal
  const { updateDailyGoal } = await import('./daily-status');
  await updateDailyGoal(userId);

  return {
    habitId: habit.id,
    completionId: completion.id,
    isNew,
  };
}
```

**Step 2: Create activities API endpoint**

```typescript
// src/app/api/v1/activities/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { logActivity, LogActivityInput } from '@/lib/habit-completion';
import { successResponse, errorResponse } from '@/lib/api-response';

export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const data: LogActivityInput = await request.json();

    if (!data.pillar || !['BODY', 'MIND'].includes(data.pillar)) {
      return errorResponse('Invalid pillar. Must be BODY or MIND.', 400);
    }

    const validCategories = {
      BODY: ['TRAINING', 'SLEEP', 'NUTRITION'],
      MIND: ['MEDITATION', 'READING', 'LEARNING', 'JOURNALING'],
    };

    if (!validCategories[data.pillar].includes(data.category)) {
      return errorResponse(`Invalid category for ${data.pillar}. Valid: ${validCategories[data.pillar].join(', ')}`, 400);
    }

    const result = await logActivity(userId, data);

    return successResponse({
      message: 'Activity logged successfully',
      ...result,
    }, 201);
  } catch (error) {
    console.error('Error logging activity:', error);
    return errorResponse('Failed to log activity', 500);
  }
});
```

**Step 3: Commit**

```bash
git add src/lib/habit-completion.ts src/app/api/v1/activities/
git commit -m "feat: Add activity logging API endpoint"
```

---

## Phase 7: New Home Screen UI

### Task 7.1: Create Daily Status Components

**Files:**
- Create: `src/components/daily/DailyStatusCard.tsx`
- Create: `src/components/daily/StreakUrgency.tsx`
- Create: `src/components/daily/QuickActions.tsx`

**Step 1: Create DailyStatusCard component**

```tsx
// src/components/daily/DailyStatusCard.tsx
'use client';

import { motion } from 'framer-motion';
import { ScoreRing } from '../scores/ScoreRing';

interface PillarStatus {
  completed: boolean;
  score: number;
  activities: Array<{ id: string; name: string; category: string }>;
}

interface DailyStatusCardProps {
  body: PillarStatus;
  mind: PillarStatus;
  onBodyClick?: () => void;
  onMindClick?: () => void;
}

export function DailyStatusCard({ body, mind, onBodyClick, onMindClick }: DailyStatusCardProps) {
  return (
    <div className="flex justify-center items-center gap-8">
      {/* Body Ring */}
      <motion.button
        onClick={onBodyClick}
        className="relative"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ScoreRing
          score={body.score}
          pillar="body"
          size={140}
          showLabel={true}
        />
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center ${
          body.completed ? 'bg-body' : 'bg-surface-lighter'
        }`}>
          {body.completed ? (
            <svg className="w-5 h-5 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-text-muted text-xs">{body.activities.length}</span>
          )}
        </div>
      </motion.button>

      {/* Divider */}
      <div className="h-20 w-px bg-surface-lighter" />

      {/* Mind Ring */}
      <motion.button
        onClick={onMindClick}
        className="relative"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ScoreRing
          score={mind.score}
          pillar="mind"
          size={140}
          showLabel={true}
        />
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center ${
          mind.completed ? 'bg-mind' : 'bg-surface-lighter'
        }`}>
          {mind.completed ? (
            <svg className="w-5 h-5 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-text-muted text-xs">{mind.activities.length}</span>
          )}
        </div>
      </motion.button>
    </div>
  );
}
```

**Step 2: Create StreakUrgency component**

```tsx
// src/components/daily/StreakUrgency.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface StreakUrgencyProps {
  current: number;
  atRisk: boolean;
  hoursRemaining: number;
  bodyComplete: boolean;
  mindComplete: boolean;
  quote: { text: string; author: string | null };
}

export function StreakUrgency({
  current,
  atRisk,
  hoursRemaining,
  bodyComplete,
  mindComplete,
  quote,
}: StreakUrgencyProps) {
  const bothComplete = bodyComplete && mindComplete;

  return (
    <div className="text-center space-y-3">
      {/* Streak Counter */}
      <motion.div
        className="flex items-center justify-center gap-2"
        animate={atRisk ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: atRisk ? Infinity : 0 }}
      >
        <span className="text-3xl">🔥</span>
        <span className="text-2xl font-bold text-text-primary">{current} day streak</span>
      </motion.div>

      {/* Quote */}
      <p className="text-text-muted italic">"{quote.text}"</p>
      {quote.author && (
        <p className="text-text-muted text-sm">— {quote.author}</p>
      )}

      {/* Status Message */}
      <AnimatePresence mode="wait">
        {bothComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-success/10 border border-success/20"
          >
            <p className="text-success font-medium">✓ Day complete! Streak secured.</p>
          </motion.div>
        ) : atRisk ? (
          <motion.div
            key="atrisk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-error/10 border border-error/20"
          >
            <p className="text-error font-medium">
              ⚠️ {!bodyComplete && !mindComplete ? 'Body & Mind' : !bodyComplete ? 'Body' : 'Mind'} incomplete
            </p>
            <p className="text-text-muted text-sm mt-1">
              Your {current}-day streak ends in {hoursRemaining}h!
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="inprogress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-surface-light"
          >
            <p className="text-text-secondary">
              {!bodyComplete && !mindComplete
                ? 'Do something for Body & Mind today'
                : !bodyComplete
                  ? 'Body activity needed'
                  : 'Mind activity needed'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 3: Create QuickActions component**

```tsx
// src/components/daily/QuickActions.tsx
'use client';

import { motion } from 'framer-motion';
import { GlowButton } from '../ui/GlowButton';

interface QuickAction {
  activity: string;
  label: string;
  duration: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (activity: string) => void;
}

export function QuickActions({ actions, onAction }: QuickActionsProps) {
  if (actions.length === 0) return null;

  const getPillarVariant = (activity: string): 'body' | 'mind' => {
    const bodyActivities = ['TRAINING', 'SLEEP', 'NUTRITION'];
    return bodyActivities.includes(activity) ? 'body' : 'mind';
  };

  return (
    <div className="space-y-3">
      <p className="text-text-muted text-sm text-center">Quick actions to save your streak:</p>
      <div className="flex flex-wrap justify-center gap-2">
        {actions.slice(0, 4).map((action, i) => (
          <motion.div
            key={action.activity}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlowButton
              variant={getPillarVariant(action.activity)}
              size="sm"
              onClick={() => onAction(action.activity)}
            >
              {action.label} ({action.duration})
            </GlowButton>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Create index export**

```typescript
// src/components/daily/index.ts
export { DailyStatusCard } from './DailyStatusCard';
export { StreakUrgency } from './StreakUrgency';
export { QuickActions } from './QuickActions';
```

**Step 5: Commit**

```bash
git add src/components/daily/
git commit -m "feat: Add daily status UI components"
```

---

### Task 7.2: Create New Home Dashboard Page

**Files:**
- Rewrite: `src/app/(dashboard)/dashboard/page.tsx`

**Step 1: Rewrite dashboard page**

```tsx
// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DailyStatusCard, StreakUrgency, QuickActions } from '@/components/daily';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmberIndicator } from '@/components/scores/EmberBar';
import { HabitListNew, HabitNew } from '@/components/habits';

interface DailyStatus {
  date: string;
  body: {
    completed: boolean;
    score: number;
    activities: Array<{ id: string; name: string; category: string; completedAt: string }>;
  };
  mind: {
    completed: boolean;
    score: number;
    activities: Array<{ id: string; name: string; category: string; completedAt: string }>;
  };
  streak: {
    current: number;
    atRisk: boolean;
    hoursRemaining: number;
  };
  recovery: {
    score: number | null;
    zone: 'green' | 'yellow' | 'red' | null;
    recommendation: string | null;
  } | null;
  quote: {
    text: string;
    author: string | null;
  };
}

interface Recommendation {
  recovery: {
    score: number | null;
    zone: 'green' | 'yellow' | 'red' | null;
    suggestion: string;
    suggestedActivities: string[];
  };
  streakStatus: {
    current: number;
    atRisk: boolean;
    hoursRemaining: number;
    quickActions: Array<{ activity: string; label: string; duration: string }>;
  };
  nextInStack: {
    stackName: string;
    activity: string;
    afterCompleting: string | null;
  } | null;
  quote: {
    text: string;
    author: string | null;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation | null>(null);
  const [habits, setHabits] = useState<HabitNew[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statusRes, recsRes, habitsRes] = await Promise.all([
        fetch('/api/v1/daily-status'),
        fetch('/api/v1/recommendations'),
        fetch('/api/v1/habits'),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data.data);
      }

      if (recsRes.ok) {
        const data = await recsRes.json();
        setRecommendations(data.data);
      }

      if (habitsRes.ok) {
        const data = await habitsRes.json();
        setHabits(data.habits?.map((h: any) => ({
          id: h.id,
          name: h.name,
          pillar: h.pillar,
          subCategory: h.subCategory,
          completedToday: h.completedToday ?? false,
        })) ?? []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickAction = async (activity: string) => {
    const pillar = ['TRAINING', 'SLEEP', 'NUTRITION'].includes(activity) ? 'BODY' : 'MIND';

    try {
      const res = await fetch('/api/v1/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillar, category: activity, source: 'manual' }),
      });

      if (res.ok) {
        fetchData(); // Refresh
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleHabitComplete = async (habitId: string, details?: string) => {
    try {
      await fetch(`/api/v1/habits/${habitId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ details }),
      });
      fetchData();
    } catch (error) {
      console.error('Error completing habit:', error);
    }
  };

  const handleHabitUncomplete = async (habitId: string) => {
    // Implementation depends on API
    console.log('Uncomplete:', habitId);
  };

  if (isLoading || !status) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-surface-light rounded w-48 mx-auto" />
        <div className="flex justify-center gap-8">
          <div className="w-36 h-36 rounded-full bg-surface-light" />
          <div className="w-36 h-36 rounded-full bg-surface-light" />
        </div>
        <div className="h-24 bg-surface-light rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-8"
    >
      {/* Streak & Quote */}
      <StreakUrgency
        current={status.streak.current}
        atRisk={status.streak.atRisk}
        hoursRemaining={status.streak.hoursRemaining}
        bodyComplete={status.body.completed}
        mindComplete={status.mind.completed}
        quote={status.quote}
      />

      {/* Daily Status Rings */}
      <DailyStatusCard
        body={status.body}
        mind={status.mind}
        onBodyClick={() => router.push('/body')}
        onMindClick={() => router.push('/mind')}
      />

      {/* Recovery Indicator (if Whoop connected) */}
      {status.recovery && (
        <GlassCard hover={false} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm">Recovery</p>
              <p className={`text-2xl font-bold ${
                status.recovery.zone === 'green' ? 'text-success' :
                status.recovery.zone === 'yellow' ? 'text-warning' : 'text-error'
              }`}>
                {status.recovery.score}%
              </p>
            </div>
            <p className="text-text-secondary text-sm max-w-[200px] text-right">
              {status.recovery.recommendation}
            </p>
          </div>
        </GlassCard>
      )}

      {/* Quick Actions (if streak at risk) */}
      {recommendations && status.streak.atRisk && (
        <QuickActions
          actions={recommendations.streakStatus.quickActions}
          onAction={handleQuickAction}
        />
      )}

      {/* Next in Stack */}
      {recommendations?.nextInStack && (
        <GlassCard hover={false} className="p-4">
          <p className="text-text-muted text-sm">Next in "{recommendations.nextInStack.stackName}"</p>
          <p className="text-text-primary font-medium mt-1">
            {recommendations.nextInStack.activity}
            {recommendations.nextInStack.afterCompleting && (
              <span className="text-text-muted font-normal">
                {' '}(after {recommendations.nextInStack.afterCompleting})
              </span>
            )}
          </p>
        </GlassCard>
      )}

      {/* Today's Habits */}
      <GlassCard hover={false} className="p-6">
        <HabitListNew
          habits={habits}
          onComplete={handleHabitComplete}
          onUncomplete={handleHabitUncomplete}
          showAddButton={true}
        />
      </GlassCard>

      {/* Ember Bar */}
      <div className="flex justify-center">
        <EmberIndicator days={status.streak.current} />
      </div>
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/dashboard/page.tsx
git commit -m "feat: Rewrite home dashboard with daily status and streak urgency"
```

---

## Phase 8: Body & Mind Dashboard Pages

### Task 8.1: Create Body Dashboard Page

**Files:**
- Create: `src/app/(dashboard)/body/page.tsx`

**Step 1: Create Body dashboard**

```tsx
// src/app/(dashboard)/body/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ScoreRing } from '@/components/scores/ScoreRing';
import { ScoreBreakdown } from '@/components/scores/ScoreBreakdown';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';

export default function BodyDashboardPage() {
  const router = useRouter();
  const [scores, setScores] = useState({
    total: 0,
    training: 0,
    sleep: 0,
    nutrition: 0,
  });
  const [weights, setWeights] = useState({
    training: 35,
    sleep: 35,
    nutrition: 30,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, weightsRes] = await Promise.all([
          fetch('/api/v1/daily-status'),
          fetch('/api/v1/weights'),
        ]);

        if (statusRes.ok) {
          const data = await statusRes.json();
          setScores({
            total: data.data.body.score,
            training: 0, // Would come from detailed endpoint
            sleep: 0,
            nutrition: 0,
          });
        }

        if (weightsRes.ok) {
          const data = await weightsRes.json();
          setWeights(data.data.body);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-surface-light rounded-xl" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-text-muted hover:text-text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-body">Body</h1>
      </div>

      {/* Main Score */}
      <div className="flex justify-center">
        <ScoreRing score={scores.total} pillar="body" size={180} showLabel={false} />
      </div>

      {/* Score Breakdown */}
      <ScoreBreakdown
        pillar="body"
        totalScore={scores.total}
        subScores={[
          { key: 'training', label: 'Training', score: scores.training },
          { key: 'sleep', label: 'Sleep', score: scores.sleep },
          { key: 'nutrition', label: 'Nutrition', score: scores.nutrition },
        ]}
      />

      {/* Category Cards */}
      <div className="grid grid-cols-1 gap-4">
        {[
          { key: 'training', label: 'Training', icon: '💪' },
          { key: 'sleep', label: 'Sleep', icon: '😴' },
          { key: 'nutrition', label: 'Nutrition', icon: '🥗' },
        ].map((cat) => (
          <GlassCard
            key={cat.key}
            className="p-4 cursor-pointer"
            onClick={() => router.push(`/body/${cat.key}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="font-medium text-text-primary">{cat.label}</p>
                  <p className="text-sm text-text-muted">Weight: {weights[cat.key as keyof typeof weights]}%</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Configure Weights */}
      <GlowButton
        variant="ghost"
        className="w-full"
        onClick={() => router.push('/settings/weights')}
      >
        Configure Weights
      </GlowButton>
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/body/
git commit -m "feat: Add Body dashboard page"
```

---

### Task 8.2: Create Mind Dashboard Page

**Files:**
- Create: `src/app/(dashboard)/mind/page.tsx`

**Step 1: Create Mind dashboard (similar structure to Body)**

```tsx
// src/app/(dashboard)/mind/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ScoreRing } from '@/components/scores/ScoreRing';
import { ScoreBreakdown } from '@/components/scores/ScoreBreakdown';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';

export default function MindDashboardPage() {
  const router = useRouter();
  const [scores, setScores] = useState({
    total: 0,
    meditation: 0,
    reading: 0,
    learning: 0,
  });
  const [weights, setWeights] = useState({
    meditation: 40,
    reading: 30,
    learning: 30,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, weightsRes] = await Promise.all([
          fetch('/api/v1/daily-status'),
          fetch('/api/v1/weights'),
        ]);

        if (statusRes.ok) {
          const data = await statusRes.json();
          setScores({
            total: data.data.mind.score,
            meditation: 0,
            reading: 0,
            learning: 0,
          });
        }

        if (weightsRes.ok) {
          const data = await weightsRes.json();
          setWeights(data.data.mind);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-surface-light rounded-xl" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-text-muted hover:text-text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-mind">Mind</h1>
      </div>

      {/* Main Score */}
      <div className="flex justify-center">
        <ScoreRing score={scores.total} pillar="mind" size={180} showLabel={false} />
      </div>

      {/* Score Breakdown */}
      <ScoreBreakdown
        pillar="mind"
        totalScore={scores.total}
        subScores={[
          { key: 'meditation', label: 'Meditation', score: scores.meditation },
          { key: 'reading', label: 'Reading', score: scores.reading },
          { key: 'learning', label: 'Learning', score: scores.learning },
        ]}
      />

      {/* Category Cards */}
      <div className="grid grid-cols-1 gap-4">
        {[
          { key: 'meditation', label: 'Meditation', icon: '🧘' },
          { key: 'reading', label: 'Reading', icon: '📚' },
          { key: 'learning', label: 'Learning', icon: '🎓' },
        ].map((cat) => (
          <GlassCard
            key={cat.key}
            className="p-4 cursor-pointer"
            onClick={() => router.push(`/mind/${cat.key}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="font-medium text-text-primary">{cat.label}</p>
                  <p className="text-sm text-text-muted">Weight: {weights[cat.key as keyof typeof weights]}%</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Configure Weights */}
      <GlowButton
        variant="ghost"
        className="w-full"
        onClick={() => router.push('/settings/weights')}
      >
        Configure Weights
      </GlowButton>
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/mind/
git commit -m "feat: Add Mind dashboard page"
```

---

## Summary

This implementation plan covers 8 phases with detailed, bite-sized tasks:

| Phase | Description | Tasks |
|-------|-------------|-------|
| 1 | Core Rebrand | Logo, quotes database |
| 2 | Daily Goal System | Status API, goal tracking |
| 3 | Weight Configuration | Presets, sliders API |
| 4 | Habit Stacking | Stack CRUD, presets |
| 5 | Recommendations | Recovery-aware suggestions |
| 6 | Activity Logging | Universal logging API |
| 7 | Home Screen UI | Status cards, urgency display |
| 8 | Pillar Dashboards | Body & Mind pages |

**API Endpoints Created:**
- `GET /api/v1/daily-status` - Daily completion status
- `GET /api/v1/streaks` - Streak information
- `GET/PUT /api/v1/weights` - Weight configuration
- `GET/POST /api/v1/stacks` - Habit stacks
- `PUT/DELETE /api/v1/stacks/:id` - Stack management
- `GET /api/v1/recommendations` - AI-ready recommendations
- `POST /api/v1/activities` - Log any activity

All endpoints are designed for Claude bot integration.
