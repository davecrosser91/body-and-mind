# Implementation Plan: Routine Game MVP

**Branch**: `main` | **Date**: 2025-01-30 | **Spec**: `.specify/memory/spec.md`

---

## Summary

Build a web-based habit tracking app with Habitanimal companions that respond to user behavior. Core features: Dashboard with habit overview, 5 Habitanimals (one per category), manual habit check-in with optional details, Whoop integration for automated sleep/fitness tracking, Habitanimal health system based on "Never Miss Twice" philosophy, and basic leveling with evolution at Level 10.

**Technical Approach**: Full-stack TypeScript with Next.js (frontend + API routes), PostgreSQL for persistence, Whoop OAuth for integration.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20 LTS
**Framework**: Next.js 14 (App Router)
**Primary Dependencies**:
- Frontend: React 18, TailwindCSS, Framer Motion (animations)
- Backend: Next.js API Routes, Prisma ORM
- Auth: NextAuth.js (email/password + OAuth ready)
- API Docs: OpenAPI/Swagger via next-swagger-doc
**Storage**: PostgreSQL (via Supabase or Railway)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Web (responsive, mobile-first)
**Project Type**: Web application (monorepo-style Next.js)
**Performance Goals**: <2s dashboard load, <100ms habit check-in response
**Constraints**: Must work offline-ready for basic viewing (PWA consideration for V2)
**Scale/Scope**: MVP for ~100 users, 5 Habitanimal types, expandable architecture

## API-First Architecture

**Principle**: Every feature MUST be accessible via REST API. The web frontend is just one client consuming the API.

**Benefits**:
- Future mobile apps use same API
- Third-party integrations possible
- Automation & scripting support
- Testability (API tests independent of UI)

**Documentation**: OpenAPI 3.0 spec auto-generated, Swagger UI at `/api/docs`

**Authentication**: JWT tokens for API access, session cookies for web UI

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. User-First Design | ✅ Pass | Dashboard-first, single-tap check-in |
| II. Atomic Habits Aligned | ✅ Pass | Never Miss Twice, habitanimal feedback loop |
| III. YAGNI | ✅ Pass | Only MVP features, no combos/social in V1 |
| IV. Test-Driven Critical Paths | ⚠️ Planned | Tests defined for XP calc, habitanimal state |
| V. Extensibility | ✅ Pass | DB schema supports new habitanimals/categories |

---

## Project Structure

### Documentation

```text
.specify/memory/
├── constitution.md      # Project principles
├── spec.md              # Feature specification
├── plan.md              # This file
└── tasks.md             # Generated tasks (next step)

docs/plans/
└── 2025-01-30-habit-game-design.md  # Original brainstorm design

research/
├── gamification-habits-mindfulness.md
└── spec-driven-frameworks.md
```

### Source Code

```text
routine-game/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── (dashboard)/        # Main app pages
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── habitanimals/      # Habitanimal detail pages
│   │   │   └── settings/       # Settings & integrations
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # NextAuth endpoints
│   │   │   ├── habits/         # Habit CRUD
│   │   │   ├── habitanimals/      # Habitanimal state
│   │   │   └── whoop/          # Whoop OAuth & sync
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI (buttons, cards, inputs)
│   │   ├── dashboard/          # Dashboard-specific
│   │   ├── habitanimals/          # Habitanimal display & animations
│   │   └── habits/             # Habit list & check-in
│   │
│   ├── lib/                    # Shared utilities
│   │   ├── db.ts               # Prisma client
│   │   ├── auth.ts             # NextAuth config
│   │   ├── xp.ts               # XP calculation logic
│   │   ├── habitanimal-health.ts  # Health state machine
│   │   └── whoop.ts            # Whoop API client
│   │
│   └── types/                  # TypeScript types
│       ├── habit.ts
│       ├── habitanimal.ts
│       └── whoop.ts
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Default habitanimals seed
│
├── tests/
│   ├── unit/                   # Vitest unit tests
│   │   ├── xp.test.ts
│   │   └── habitanimal-health.test.ts
│   └── e2e/                    # Playwright e2e tests
│       ├── auth.spec.ts
│       └── habit-checkin.spec.ts
│
├── public/
│   └── habitanimals/              # Habitanimal images/animations
│
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

**Structure Decision**: Monorepo-style Next.js with colocated API routes. Simple for MVP, can extract to separate backend later if needed.

---

## Data Model

### Core Entities

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  habits        Habit[]
  habitanimals     Habitanimal[]
  whoopConnection WhoopConnection?
}

model Habit {
  id          String    @id @default(cuid())
  name        String
  category    Category
  frequency   Frequency @default(DAILY)
  createdAt   DateTime  @default(now())
  archived    Boolean   @default(false)

  userId      String
  user        User      @relation(fields: [userId], references: [id])
  completions HabitCompletion[]
}

model HabitCompletion {
  id          String    @id @default(cuid())
  completedAt DateTime  @default(now())
  details     String?   // Optional: "30 minutes", "2L water"
  xpEarned    Int
  source      Source    @default(MANUAL)

  habitId     String
  habit       Habit     @relation(fields: [habitId], references: [id])
}

model Habitanimal {
  id              String    @id @default(cuid())
  type            HabitanimalType
  species         String    // "gorilla", "turtle", "ox", "sloth", "fox"
  name            String    // "Guiro", "Zen", "Greeny", "Milo", "Finn"
  level           Int       @default(1)
  xp              Int       @default(0)
  health          Int       @default(100)  // 0-100
  evolutionStage  Int       @default(1)    // 1=Baby, 2=Teen, 3=Adult, 4=Legendary
  lastInteraction DateTime  @default(now())

  userId          String
  user            User      @relation(fields: [userId], references: [id])
}

model WhoopConnection {
  id            String    @id @default(cuid())
  accessToken   String
  refreshToken  String
  expiresAt     DateTime
  lastSync      DateTime?

  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
}

enum Category {
  FITNESS
  MINDFULNESS
  NUTRITION
  SLEEP
  LEARNING
}

enum HabitanimalType {
  FITNESS      // Guiro the Gorilla 🦍
  MINDFULNESS  // Zen the Turtle 🐢
  NUTRITION    // Greeny the Ox 🐂
  SLEEP        // Milo the Sloth 🦥
  LEARNING     // Finn the Fox 🦊
}

enum Frequency {
  DAILY
  WEEKLY
  CUSTOM
}

enum Source {
  MANUAL
  WHOOP
  APPLE_HEALTH  // Future
}
```

---

## Key Algorithms

### XP Calculation

```typescript
// lib/xp.ts
const BASE_XP = 10;
const DETAIL_BONUS_MULTIPLIER = 1.5;

function calculateXP(habit: Habit, details?: string): number {
  let xp = BASE_XP;

  // Bonus for providing details
  if (details && details.length > 0) {
    xp = Math.floor(xp * DETAIL_BONUS_MULTIPLIER);
  }

  return xp;
}

function xpToLevel(totalXp: number): number {
  // Level formula: each level requires level * 100 XP
  // Level 1: 0-99, Level 2: 100-299, Level 3: 300-599...
  let level = 1;
  let xpNeeded = 100;
  let accumulated = 0;

  while (accumulated + xpNeeded <= totalXp) {
    accumulated += xpNeeded;
    level++;
    xpNeeded = level * 100;
  }

  return level;
}

function evolutionStage(level: number): number {
  if (level >= 50) return 4; // Legendary
  if (level >= 25) return 3; // Adult
  if (level >= 10) return 2; // Teen
  return 1; // Baby
}
```

### Habitanimal Health (Never Miss Twice)

```typescript
// lib/habitanimal-health.ts
const HEALTH_DECAY_SINGLE_MISS = 10;   // Miss 1 day
const HEALTH_DECAY_DOUBLE_MISS = 30;   // Miss 2+ consecutive days
const HEALTH_RECOVERY_PER_HABIT = 15;
const MAX_HEALTH = 100;

function calculateHealth(
  currentHealth: number,
  lastCompletion: Date | null,
  now: Date
): number {
  if (!lastCompletion) return currentHealth;

  const daysMissed = getDaysDifference(lastCompletion, now) - 1;

  if (daysMissed === 0) {
    // Completed today or yesterday - no decay
    return currentHealth;
  } else if (daysMissed === 1) {
    // Missed 1 day - small decay (Never Miss Twice grace)
    return Math.max(0, currentHealth - HEALTH_DECAY_SINGLE_MISS);
  } else {
    // Missed 2+ days - larger decay
    const extraDays = daysMissed - 1;
    const decay = HEALTH_DECAY_SINGLE_MISS + (extraDays * HEALTH_DECAY_DOUBLE_MISS);
    return Math.max(0, currentHealth - decay);
  }
}

function recoverHealth(currentHealth: number): number {
  return Math.min(MAX_HEALTH, currentHealth + HEALTH_RECOVERY_PER_HABIT);
}
```

---

## API Endpoints (Complete)

**Base URL**: `/api/v1`
**Auth**: Bearer token (JWT) in `Authorization` header
**Format**: JSON request/response
**Docs**: Swagger UI at `/api/docs`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create account, returns JWT |
| POST | `/auth/login` | Login, returns JWT |
| POST | `/auth/logout` | Invalidate token |
| POST | `/auth/refresh` | Refresh JWT token |
| GET | `/auth/me` | Get current user profile |
| PATCH | `/auth/me` | Update user profile |
| DELETE | `/auth/me` | Delete account |

### Habits (Full CRUD)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/habits` | List all habits (with filters) |
| POST | `/habits` | Create new habit |
| GET | `/habits/:id` | Get habit details |
| PATCH | `/habits/:id` | Update habit |
| DELETE | `/habits/:id` | Delete/archive habit |
| POST | `/habits/:id/complete` | Mark habit complete |
| DELETE | `/habits/:id/complete/:completionId` | Undo completion |
| GET | `/habits/:id/history` | Get completion history |
| GET | `/habits/stats` | Get habit statistics |

### Habitanimals (Full Control)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/habitanimals` | List all user's habitanimals |
| GET | `/habitanimals/:id` | Get habitanimal details (level, XP, health, evolution) |
| PATCH | `/habitanimals/:id` | Update habitanimal (name) |
| GET | `/habitanimals/:id/history` | Get XP/health history |
| POST | `/habitanimals/:id/feed` | Manual XP boost (future: items) |

### Dashboard & Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get full dashboard state (habits + habitanimals + today's status) |
| GET | `/stats/overview` | Get overall statistics |
| GET | `/stats/streaks` | Get streak information per category |

### Integrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/integrations` | List available integrations |
| GET | `/integrations/whoop` | Get Whoop connection status |
| POST | `/integrations/whoop/connect` | Start Whoop OAuth flow |
| GET | `/integrations/whoop/callback` | Whoop OAuth callback |
| POST | `/integrations/whoop/sync` | Manual sync trigger |
| DELETE | `/integrations/whoop` | Disconnect Whoop |

### Notifications (Optional)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications/settings` | Get notification preferences |
| PATCH | `/notifications/settings` | Update notification preferences |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI documentation |
| GET | `/openapi.json` | OpenAPI spec (JSON) |

---

## External Dependencies

### Whoop API

- **Auth**: OAuth 2.0 flow
- **Endpoints needed**:
  - `GET /v1/cycle` - Recovery & strain data
  - `GET /v1/sleep` - Sleep data
- **Rate limits**: Check Whoop developer docs
- **Webhook**: Consider for real-time sync (V2)

### Deployment

- **Hosting**: Vercel (Next.js optimized)
- **Database**: Supabase PostgreSQL or Railway
- **Environment Variables**:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `WHOOP_CLIENT_ID`
  - `WHOOP_CLIENT_SECRET`

---

## Complexity Tracking

No constitution violations requiring justification. Architecture is intentionally simple for MVP.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Whoop API changes | Abstract behind interface, manual fallback always works |
| Habitanimal art delays | Use placeholder SVGs, swap later |
| Scope creep | Strict MVP checklist, no combos/social in V1 |
| Auth complexity | Use NextAuth.js battle-tested solution |
