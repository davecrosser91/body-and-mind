# Premium Body + Mind Redesign

> Transform from playful Habitanimals to premium wellness scoring system

**Created**: 2025-01-31
**Status**: Implementation Plan

---

## Vision

A premium, Whoop/Oura-inspired wellness app with two core pillars: **Body** and **Mind**. Replace cute animal companions with sophisticated score visualizations, streaks, and elegant animations. Target audience: Barcelona fitness lifestyle people who want serious tracking with beautiful UX.

**Inspired by**: Whoop, Oura Ring, Apple Watch rings

---

## Core Concept Changes

### From → To

| Current | New |
|---------|-----|
| 5 Habitanimals (cute animals) | 2 Score Rings (Body + Mind) |
| XP & Levels per animal | Scores 0-100 per pillar |
| Evolution stages | Streak milestones & achievements |
| Playful colors | Premium dark mode with warm/cool accents |
| Animal health | Score trends & consistency |

### The Two Pillars

**Body (Warm Amber #E8A854)**
- Training (workouts, strain) → Whoop auto-sync
- Sleep (duration, quality, recovery) → Whoop auto-sync
- Nutrition (meals, hydration) → Manual

**Mind (Cool Teal #5BCCB3)**
- Meditation (sessions, duration) → Manual
- Reading (pages, books) → Manual
- Learning (skills, courses) → Manual
- Journaling → Manual

### Balance Index

Combined score showing Body + Mind harmony:
- `Balance = (Body Score + Mind Score) / 2`
- Displayed as smaller ring between the two pillars
- Bonus points when both pillars are balanced (within 15 points of each other)

---

## Score Calculation

### Body Score (0-100)

```typescript
// Daily Body Score calculation
const bodyScore = weightedAverage([
  { value: trainingScore, weight: 0.35 },    // From workouts
  { value: sleepScore, weight: 0.40 },       // From sleep quality
  { value: nutritionScore, weight: 0.25 },   // From manual habits
]);

// Training Score (from Whoop strain or manual)
// Whoop: strain 0-21 mapped to 0-100
// Manual: completion percentage of training habits

// Sleep Score (from Whoop)
// Uses sleep_performance_percentage directly (0-100)
// Fallback: manual sleep habit completion

// Nutrition Score
// Completion percentage of nutrition habits today
```

### Mind Score (0-100)

```typescript
// Daily Mind Score calculation
const mindScore = weightedAverage([
  { value: meditationScore, weight: 0.35 },
  { value: readingScore, weight: 0.30 },
  { value: learningScore, weight: 0.35 },
]);

// Each sub-score = completion percentage of habits in that category
// Bonus: +10 points if habit includes details (duration, pages, etc.)
```

### Whoop Data Mapping

| Whoop Metric | Maps To | Score Formula |
|--------------|---------|---------------|
| `workout.strain` (0-21) | Training | `(strain / 21) * 100` |
| `sleep.sleep_performance_percentage` | Sleep | Direct (0-100) |
| `recovery.recovery_score` | Sleep modifier | Multiplier: `0.8 + (recovery/500)` |
| `sleep.sleep_efficiency_percentage` | Sleep bonus | `+5` if > 85% |

---

## Database Schema Changes

### New Enums

```prisma
enum Pillar {
  BODY
  MIND
}

enum SubCategory {
  // Body
  TRAINING
  SLEEP
  NUTRITION
  // Mind
  MEDITATION
  READING
  LEARNING
  JOURNALING
}
```

### Updated Models

```prisma
model Habit {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])

  name        String
  description String?
  pillar      Pillar      // NEW: BODY or MIND
  subCategory SubCategory // NEW: specific category
  frequency   Frequency   @default(DAILY)
  archived    Boolean     @default(false)

  completions HabitCompletion[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model DailyScore {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  date      DateTime @db.Date

  // Scores
  bodyScore      Int      // 0-100
  mindScore      Int      // 0-100
  balanceIndex   Int      // 0-100

  // Sub-scores for detail view
  trainingScore  Int?
  sleepScore     Int?
  nutritionScore Int?
  meditationScore Int?
  readingScore   Int?
  learningScore  Int?

  // Whoop data snapshot
  whoopStrain    Float?
  whoopSleep     Float?
  whoopRecovery  Float?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, date])
}

model Streak {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  pillar    Pillar?  // null = overall streak
  current   Int      @default(0)
  longest   Int      @default(0)
  lastActiveDate DateTime?

  @@unique([userId, pillar])
}

model Achievement {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  type        String   // e.g., "streak_7", "streak_30", "perfect_balance"
  unlockedAt  DateTime @default(now())

  @@unique([userId, type])
}
```

### Migration Strategy

1. Add new columns alongside old ones
2. Migrate data: map old categories to new pillars
3. Calculate initial scores from existing completions
4. Remove old Habitanimal-specific columns

Category mapping:
- FITNESS → BODY/TRAINING
- SLEEP → BODY/SLEEP
- NUTRITION → BODY/NUTRITION
- MINDFULNESS → MIND/MEDITATION
- LEARNING → MIND/LEARNING

---

## UI Components

### Color System

```typescript
// tailwind.config.ts
const colors = {
  // Base
  background: '#0D0D0F',
  surface: '#1A1A1D',
  surfaceLight: '#242428',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  // Accents
  body: {
    DEFAULT: '#E8A854',
    light: '#F5C77D',
    dark: '#C78A3A',
    glow: 'rgba(232, 168, 84, 0.3)',
  },
  mind: {
    DEFAULT: '#5BCCB3',
    light: '#7EDBC8',
    dark: '#45A894',
    glow: 'rgba(91, 204, 179, 0.3)',
  },

  // Status
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
};
```

### New Components

```
src/components/
├── scores/
│   ├── ScoreRing.tsx          # Animated circular score (0-100)
│   ├── ScoreDashboard.tsx     # Body + Mind + Balance layout
│   ├── ScoreBreakdown.tsx     # Expandable sub-score details
│   └── ScoreTrend.tsx         # Week/month trend mini-chart
│
├── streaks/
│   ├── EmberBar.tsx           # Horizontal streak indicator
│   ├── StreakMilestone.tsx    # Milestone celebration
│   └── StreakStats.tsx        # Current/longest streak display
│
├── habits/
│   ├── HabitCard.tsx          # Redesigned habit card (dark)
│   ├── HabitList.tsx          # Updated list with pillar grouping
│   ├── HabitCheckIn.tsx       # Premium check-in button
│   └── CreateHabitModal.tsx   # Updated with pillar selection
│
├── celebrations/
│   ├── ScoreReveal.tsx        # Daily score animation
│   ├── MilestoneUnlock.tsx    # Achievement unlock animation
│   └── ParticleBurst.tsx      # Light particle effects
│
└── ui/
    ├── GlassCard.tsx          # Glassmorphism card
    ├── GlowButton.tsx         # Button with glow effect
    └── AnimatedCounter.tsx    # Smooth number transitions
```

---

## Animation Specifications

### Score Ring Animation

```typescript
// ScoreRing.tsx
const ScoreRing = ({ score, pillar, size = 160 }) => {
  const circumference = 2 * Math.PI * 70; // radius 70

  return (
    <motion.svg width={size} height={size}>
      {/* Background ring */}
      <circle
        cx={size/2} cy={size/2} r={70}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={8}
        fill="none"
      />

      {/* Score ring */}
      <motion.circle
        cx={size/2} cy={size/2} r={70}
        stroke={pillar === 'BODY' ? '#E8A854' : '#5BCCB3'}
        strokeWidth={8}
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: score / 100 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
      />

      {/* Animated score number */}
      <AnimatedCounter value={score} />
    </motion.svg>
  );
};
```

### Ember Bar (Streak)

```typescript
// EmberBar.tsx - Streak visualization
const getEmberIntensity = (days: number) => {
  if (days >= 14) return { glow: 'golden', particles: true };
  if (days >= 7) return { glow: 'bright', particles: false };
  if (days >= 4) return { glow: 'steady', particles: false };
  return { glow: 'dim', particles: false };
};

// Colors by intensity
const emberColors = {
  dim: 'rgba(232, 168, 84, 0.3)',
  steady: 'rgba(232, 168, 84, 0.6)',
  bright: '#E8A854',
  golden: 'linear-gradient(90deg, #E8A854, #FFD700)',
};
```

### Daily Score Reveal

When opening app:
1. Rings fade in (300ms)
2. Score draws from 0 (800ms each, staggered 200ms)
3. Balance index pulses once
4. If milestone: celebration overlay

### Celebration Particles

Light particles instead of confetti:
- 15-20 particles max
- Drift upward with slight horizontal sway
- Fade out over 2 seconds
- Colors match pillar (amber for Body, teal for Mind)

---

## Page Layouts

### Dashboard (Main)

```
┌─────────────────────────────────────┐
│  Good morning, David          [⚙️]  │
│                                     │
│  ┌─────────┐  ┌───┐  ┌─────────┐   │
│  │  BODY   │  │BAL│  │  MIND   │   │
│  │   78    │  │82 │  │   86    │   │
│  │  ○○○○   │  │   │  │  ○○○○   │   │
│  └─────────┘  └───┘  └─────────┘   │
│                                     │
│  ════════════════════════ 12 days  │ <- Ember bar
│                                     │
│  Today's Habits                     │
│  ┌─────────────────────────────┐   │
│  │ ○ Morning workout    BODY   │   │
│  │ ● Meditation 10min   MIND   │   │
│  │ ○ Read 30 pages      MIND   │   │
│  │ ○ Healthy lunch      BODY   │   │
│  └─────────────────────────────┘   │
│                                     │
│  [+ Add Habit]                      │
│                                     │
│  ─────────────────────────────────  │
│  │ Dashboard │ Insights │ Settings │
└─────────────────────────────────────┘
```

### Insights Page

- Weekly score trends (line chart)
- Best/worst days
- Pillar balance over time
- Streak history
- Achievements gallery

---

## Implementation Phases

### Phase 1: Foundation (Database + Core Logic)
- [ ] Create Prisma migration for new schema
- [ ] Write data migration script (old → new)
- [ ] Implement score calculation service
- [ ] Update Whoop sync to calculate scores
- [ ] Add streak tracking logic

### Phase 2: Design System
- [ ] Update Tailwind config with new colors
- [ ] Create dark theme globals.css
- [ ] Build GlassCard component
- [ ] Build GlowButton component
- [ ] Build AnimatedCounter component

### Phase 3: Score Components
- [ ] Build ScoreRing component
- [ ] Build ScoreDashboard layout
- [ ] Build EmberBar streak component
- [ ] Build ScoreBreakdown expandable
- [ ] Add daily reveal animation

### Phase 4: Habit System Update
- [ ] Redesign HabitCard (dark theme)
- [ ] Update CreateHabitModal (pillar selection)
- [ ] Update HabitList (grouped by pillar)
- [ ] Premium check-in interaction

### Phase 5: Pages & Navigation
- [ ] Redesign Dashboard page
- [ ] Create Insights page
- [ ] Update Settings page
- [ ] Update navigation (bottom tabs)

### Phase 6: Celebrations & Polish
- [ ] Score reveal animation
- [ ] Milestone unlock animation
- [ ] Particle effects
- [ ] Haptic feedback (PWA)
- [ ] Sound effects (optional)

### Phase 7: Migration & Cleanup
- [ ] Run data migration
- [ ] Remove old Habitanimal components
- [ ] Update tests
- [ ] Performance optimization

---

## Files to Create/Modify

### New Files
```
src/lib/scores.ts              # Score calculation logic
src/lib/streaks.ts             # Streak management
src/components/scores/*        # All score components
src/components/streaks/*       # Streak components
src/components/celebrations/*  # New celebration components
src/app/(dashboard)/insights/  # New insights page
prisma/migrations/xxx_body_mind_redesign/
```

### Files to Modify
```
prisma/schema.prisma           # New models
tailwind.config.ts             # New color system
src/app/globals.css            # Dark theme
src/lib/whoop-sync.ts          # Score calculation from Whoop
src/components/habits/*        # Redesign
src/components/ui/*            # New base components
src/app/(dashboard)/page.tsx   # Dashboard redesign
src/app/(dashboard)/layout.tsx # Navigation update
```

### Files to Delete (Phase 7)
```
src/components/habitanimals/*  # All animal components
```

---

## Success Metrics

- Premium feel: Dark, smooth, sophisticated
- Load time: < 2s for dashboard with animations
- Animation FPS: 60fps on mobile
- Accessibility: Reduced motion support, contrast ratios
- User retention: Streak visualization drives daily opens
