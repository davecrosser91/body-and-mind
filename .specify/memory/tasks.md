# Tasks: Routine Game MVP

**Input**: `.specify/memory/spec.md`, `.specify/memory/plan.md`
**Created**: 2025-01-30

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)

---

## Phase 1: Setup

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js 14 project with TypeScript, TailwindCSS, App Router
- [ ] T002 [P] Configure ESLint, Prettier, and strict TypeScript
- [ ] T003 [P] Setup Prisma with PostgreSQL connection
- [ ] T004 [P] Create project folder structure per plan.md
- [ ] T005 [P] Setup environment variables (.env.example, .env.local)
- [ ] T006 Install dependencies: next-auth, framer-motion, zod, next-swagger-doc

**Checkpoint**: Project builds and runs with empty pages

---

## Phase 2: Foundation (Blocks all User Stories)

**Purpose**: Core infrastructure required before any feature work

### Database Schema

- [ ] T010 Create Prisma schema with all models (User, Habit, HabitCompletion, Habitanimal, WhoopConnection)
- [ ] T011 Add enums: Category, HabitanimalType, Frequency, Source
- [ ] T012 Run initial migration: `prisma migrate dev --name init`
- [ ] T013 Create seed script for 5 default Habitanimals (Guiro, Zen, Greeny, Milo, Finn)

### Authentication

- [ ] T014 Configure NextAuth.js with credentials provider (email/password)
- [ ] T015 [P] Create auth API routes: `/api/auth/[...nextauth]`
- [ ] T016 [P] Create signup API route: `POST /api/v1/auth/signup`
- [ ] T017 [P] Create JWT token generation for API access
- [ ] T018 Create auth middleware for protected API routes

### API Infrastructure

- [ ] T019 Setup API route structure under `/api/v1/`
- [ ] T020 [P] Create base response helpers (success, error, validation)
- [ ] T021 [P] Setup OpenAPI/Swagger documentation at `/api/docs`
- [ ] T022 [P] Create health check endpoint: `GET /api/v1/health`
- [ ] T023 Create Zod schemas for request validation

### Core Libraries

- [ ] T024 Implement XP calculation logic in `src/lib/xp.ts`
- [ ] T025 [P] Write unit tests for XP calculation
- [ ] T026 Implement Habitanimal health state machine in `src/lib/habitanimal-health.ts`
- [ ] T027 [P] Write unit tests for health state machine (Never Miss Twice logic)

**Checkpoint**: Auth works, DB connected, core logic tested

---

## Phase 3: User Story 1 - Dashboard Overview (P1) 🎯 MVP

**Goal**: User sees habits and Habitanimals at a glance

**Independent Test**: Load dashboard, verify all 5 Habitanimals displayed with status

### API Endpoints

- [ ] T030 [US1] Create `GET /api/v1/dashboard` - returns full dashboard state
- [ ] T031 [P] [US1] Create `GET /api/v1/habitanimals` - list all user's Habitanimals
- [ ] T032 [P] [US1] Create `GET /api/v1/habitanimals/:id` - single Habitanimal details
- [ ] T033 [P] [US1] Create `GET /api/v1/habits` - list all user's habits with today's status

### Frontend Components

- [ ] T034 [US1] Create Dashboard page layout `src/app/(dashboard)/page.tsx`
- [ ] T035 [P] [US1] Create HabitanimalCard component (shows health, level, mood)
- [ ] T036 [P] [US1] Create HabitanimalGrid component (displays all 5)
- [ ] T037 [P] [US1] Create HabitList component (today's habits with status)
- [ ] T038 [P] [US1] Create StatsOverview component (quick stats summary)
- [ ] T039 [US1] Wire up Dashboard to fetch from `/api/v1/dashboard`

### Habitanimal Visuals

- [ ] T040 [P] [US1] Create placeholder SVGs for each Habitanimal (Guiro, Zen, Greeny, Milo, Finn)
- [ ] T041 [P] [US1] Create mood states: happy, neutral, tired, sad
- [ ] T042 [US1] Add Framer Motion animations for Habitanimal state changes

**Checkpoint**: Dashboard loads, shows 5 Habitanimals with placeholder art, lists habits

---

## Phase 4: User Story 2 - Manual Habit Check-in (P1) 🎯 MVP

**Goal**: User can mark habits complete, Habitanimals gain XP

**Independent Test**: Complete habit, verify XP increases for correct Habitanimal

### API Endpoints

- [ ] T050 [US2] Create `POST /api/v1/habits` - create new habit
- [ ] T051 [P] [US2] Create `GET /api/v1/habits/:id` - get habit details
- [ ] T052 [P] [US2] Create `PATCH /api/v1/habits/:id` - update habit
- [ ] T053 [P] [US2] Create `DELETE /api/v1/habits/:id` - archive habit
- [ ] T054 [US2] Create `POST /api/v1/habits/:id/complete` - mark complete with optional details
- [ ] T055 [P] [US2] Create `GET /api/v1/habits/:id/history` - completion history

### Backend Logic

- [ ] T056 [US2] Implement habit completion service (creates HabitCompletion, updates Habitanimal XP)
- [ ] T057 [US2] Implement level-up detection and evolution check
- [ ] T058 [P] [US2] Write tests for habit completion flow

### Frontend Components

- [ ] T059 [US2] Create HabitCheckInButton component (single tap complete)
- [ ] T060 [P] [US2] Create HabitDetailModal (optional details input: duration, notes)
- [ ] T061 [P] [US2] Create CreateHabitModal (name, category selection)
- [ ] T062 [US2] Add XP gain animation on Habitanimal when habit completed
- [ ] T063 [US2] Add level-up celebration animation

**Checkpoint**: Can create habits, complete them, see Habitanimal XP increase

---

## Phase 5: User Story 3 - Habitanimal Health System (P1) 🎯 MVP

**Goal**: Habitanimals visually reflect habit consistency

**Independent Test**: Miss 2 days, verify Habitanimal appears sad; complete habit, verify recovery

### Backend Logic

- [ ] T070 [US3] Create daily health update job/trigger (calculates health based on last completion)
- [ ] T071 [US3] Implement health decay logic (1 day = small decay, 2+ days = larger decay)
- [ ] T072 [US3] Implement health recovery on habit completion
- [ ] T073 [P] [US3] Write tests for health decay/recovery scenarios

### API Endpoints

- [ ] T074 [US3] Update `GET /api/v1/habitanimals/:id` to include health history
- [ ] T075 [P] [US3] Create `GET /api/v1/habitanimals/:id/history` - health/XP over time

### Frontend Components

- [ ] T076 [US3] Update HabitanimalCard to show health bar
- [ ] T077 [US3] Implement mood determination based on health (>70 happy, 40-70 tired, <40 sad)
- [ ] T078 [US3] Add health change animations (recovery sparkle, decay droop)
- [ ] T079 [US3] Create Habitanimal detail page `src/app/(dashboard)/habitanimals/[id]/page.tsx`

**Checkpoint**: Habitanimals respond to habit consistency, visual mood changes work

---

## Phase 6: User Story 4 - Authentication (P1) 🎯 MVP

**Goal**: Users can create accounts and login securely

**Independent Test**: Sign up, log out, log back in, verify data persists

### API Endpoints

- [ ] T080 [US4] Create `POST /api/v1/auth/logout` - invalidate session
- [ ] T081 [P] [US4] Create `GET /api/v1/auth/me` - get current user profile
- [ ] T082 [P] [US4] Create `PATCH /api/v1/auth/me` - update profile
- [ ] T083 [P] [US4] Create `POST /api/v1/auth/refresh` - refresh JWT token

### Frontend Pages

- [ ] T084 [US4] Create Login page `src/app/(auth)/login/page.tsx`
- [ ] T085 [P] [US4] Create Signup page `src/app/(auth)/signup/page.tsx`
- [ ] T086 [P] [US4] Create auth form components (email input, password input)
- [ ] T087 [US4] Implement protected route wrapper (redirect to login if not auth'd)
- [ ] T088 [US4] Add session persistence (stay logged in on refresh)

### Onboarding

- [ ] T089 [US4] Create onboarding flow for new users (welcome, meet your Habitanimals)
- [ ] T090 [US4] Auto-create 5 Habitanimals on signup (Guiro, Zen, Greeny, Milo, Finn)

**Checkpoint**: Full auth flow works, new users get 5 Habitanimals automatically

---

## Phase 7: User Story 5 - Whoop Integration (P2)

**Goal**: Sleep and workout data automatically updates Habitanimals

**Independent Test**: Connect Whoop, verify sleep data syncs to Milo (Sleep Habitanimal)

### Whoop OAuth

- [ ] T100 [US5] Register Whoop developer app, get client credentials
- [ ] T101 [US5] Create `POST /api/v1/integrations/whoop/connect` - start OAuth flow
- [ ] T102 [US5] Create `GET /api/v1/integrations/whoop/callback` - OAuth callback
- [ ] T103 [US5] Store Whoop tokens securely (encrypted in DB)
- [ ] T104 [P] [US5] Create `DELETE /api/v1/integrations/whoop` - disconnect

### Whoop Data Sync

- [ ] T105 [US5] Create Whoop API client in `src/lib/whoop.ts`
- [ ] T106 [US5] Implement sleep data fetch (duration, quality, HRV, recovery)
- [ ] T107 [US5] Implement strain/workout data fetch
- [ ] T108 [US5] Create `POST /api/v1/integrations/whoop/sync` - manual sync trigger
- [ ] T109 [US5] Map Whoop data to Habitanimal XP:
  - Sleep quality → Milo (Sleep) XP
  - Recovery score → Milo health boost
  - Strain score → Guiro (Fitness) XP

### Frontend

- [ ] T110 [US5] Create Settings page `src/app/(dashboard)/settings/page.tsx`
- [ ] T111 [P] [US5] Create Integrations section with Whoop connect button
- [ ] T112 [US5] Show Whoop connection status (connected, last sync time)
- [ ] T113 [US5] Add "Sync Now" button for manual refresh

**Checkpoint**: Whoop connected, sleep/workout data flows to correct Habitanimals

---

## Phase 8: User Story 6 - Leveling & Evolution (P2)

**Goal**: Habitanimals level up and evolve at milestones

**Independent Test**: Accumulate XP to level 10, verify evolution animation and new form

### Backend

- [ ] T120 [US6] Define XP thresholds per level (level * 100 formula)
- [ ] T121 [US6] Define evolution stages: Baby (1-9), Teen (10-24), Adult (25-49), Legendary (50+)
- [ ] T122 [US6] Create evolution trigger on level-up
- [ ] T123 [P] [US6] Write tests for leveling and evolution logic

### Frontend

- [ ] T124 [US6] Create evolution animation (transformation sequence)
- [ ] T125 [P] [US6] Create level-up notification/modal
- [ ] T126 [US6] Show progress to next level on HabitanimalCard
- [ ] T127 [US6] Show progress to next evolution stage
- [ ] T128 [US6] Create different visuals for each evolution stage (4 stages × 5 Habitanimals = 20 variants)

**Checkpoint**: Habitanimals evolve at level 10, celebration animation plays

---

## Phase 9: User Story 7 - Habit Categories (P2)

**Goal**: Each habit linked to correct Habitanimal

**Independent Test**: Create Fitness habit, complete it, verify Guiro gains XP

### Backend

- [ ] T130 [US7] Ensure habit category maps to correct Habitanimal type
- [ ] T131 [P] [US7] Create category validation on habit creation

### Frontend

- [ ] T132 [US7] Create category picker in CreateHabitModal (with Habitanimal preview)
- [ ] T133 [US7] Show which Habitanimal benefits on habit card
- [ ] T134 [US7] Add category filter to habit list

**Checkpoint**: Clear connection between habits and their Habitanimals

---

## Phase 10: API Documentation & Polish

**Purpose**: Complete API docs, final polish

### API Documentation

- [ ] T140 [P] Document all endpoints in OpenAPI spec
- [ ] T141 [P] Add request/response examples to Swagger UI
- [ ] T142 [P] Create API README with authentication guide

### Testing & Quality

- [ ] T143 Run all unit tests, fix failures
- [ ] T144 [P] Create E2E tests for critical flows (signup, habit completion, level-up)
- [ ] T145 Performance check: dashboard load < 2s

### UI Polish

- [ ] T146 [P] Responsive design check (mobile, tablet, desktop)
- [ ] T147 [P] Loading states for all async operations
- [ ] T148 [P] Error handling UI (toast notifications)
- [ ] T149 Accessibility audit (keyboard nav, screen readers)

### Deployment Prep

- [ ] T150 [P] Setup Vercel project
- [ ] T151 [P] Configure production database (Supabase/Railway)
- [ ] T152 Setup environment variables in Vercel
- [ ] T153 Deploy MVP to production

**Checkpoint**: MVP live, API documented, core flows tested

---

## Dependencies Summary

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation) ← BLOCKS ALL
    ↓
┌───────────────────────────────────────────┐
│  Phase 3-6 (P1 Stories) - Can parallelize │
│  • US1: Dashboard                         │
│  • US2: Habit Check-in                    │
│  • US3: Health System                     │
│  • US4: Authentication                    │
└───────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────┐
│  Phase 7-9 (P2 Stories) - Can parallelize │
│  • US5: Whoop Integration                 │
│  • US6: Leveling & Evolution              │
│  • US7: Habit Categories                  │
└───────────────────────────────────────────┘
    ↓
Phase 10 (Polish & Deploy)
```

---

## MVP Minimum (Fastest Path)

If time-constrained, this is the minimum for a working MVP:

1. **Phase 1**: T001-T006 (Setup)
2. **Phase 2**: T010-T027 (Foundation)
3. **Phase 3**: T030-T039 (Dashboard - skip fancy animations)
4. **Phase 4**: T050-T058 (Habit Check-in - skip modals, use simple forms)
5. **Phase 6**: T084-T090 (Auth)

**Result**: Users can sign up, see Habitanimals, complete habits, see XP grow.

Total: ~40 tasks for bare minimum MVP.
