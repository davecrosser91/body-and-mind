# Feature Specification: Routine Game MVP

**Feature Branch**: `main`
**Created**: 2025-01-30
**Status**: Draft
**Input**: Gamified habit-tracking app with habitanimal companions, Atomic Habits principles, Whoop integration

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dashboard Overview (Priority: P1)

As a user, I want to see my daily habit status and habitanimal health at a glance when I open the app, so I know what needs attention today.

**Why this priority**: This is the core entry point. Without a functional dashboard, users have no way to interact with the app.

**Independent Test**: Can be fully tested by loading the dashboard and verifying all habit categories and habitanimal states are displayed correctly.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I open the app, **Then** I see a dashboard with today's date, my 5 habitanimals, and their current health/level status
2. **Given** I have incomplete habits today, **When** I view the dashboard, **Then** I see which habits are pending vs completed
3. **Given** I completed all habits yesterday, **When** I view the dashboard, **Then** my habitanimals appear healthy and happy

---

### User Story 2 - Manual Habit Check-in (Priority: P1)

As a user, I want to mark habits as complete with optional details, so my habitanimals gain XP and grow.

**Why this priority**: Core functionality. Without habit tracking, the entire gamification system has no input.

**Independent Test**: Can be fully tested by checking off a habit and verifying the associated habitanimal gains XP.

**Acceptance Scenarios**:

1. **Given** I have a pending habit "Meditate", **When** I tap "Complete", **Then** the habit is marked done and Zen (my Mindfulness Habitanimal) gains XP
2. **Given** I complete a habit, **When** I add details "30 minutes", **Then** bonus XP is calculated based on duration
3. **Given** I complete a habit, **When** the habitanimal gains enough XP, **Then** it levels up with visual feedback

---

### User Story 3 - Habitanimal Health System (Priority: P1)

As a user, I want my habitanimals to visually reflect my habit consistency, so I feel emotionally connected to my progress.

**Why this priority**: Emotional engagement is the core differentiator. Habitanimals must respond to habit behavior.

**Independent Test**: Can be tested by missing habits for 1-2 days and observing habitanimal health changes.

**Acceptance Scenarios**:

1. **Given** I completed habits yesterday, **When** I view my habitanimal today, **Then** it appears healthy and energetic
2. **Given** I missed one day of habits, **When** I view my habitanimal, **Then** it appears slightly tired but recoverable (Never Miss Twice rule)
3. **Given** I missed two consecutive days, **When** I view my habitanimal, **Then** it appears sad and has reduced health
4. **Given** my habitanimal is sad, **When** I complete a habit, **Then** it begins recovering and shows gratitude

---

### User Story 4 - User Authentication (Priority: P1)

As a user, I want to create an account and log in securely, so my progress is saved.

**Why this priority**: Required for any persistent data. No auth = no saved progress.

**Independent Test**: Can be tested by creating account, logging out, logging back in, and verifying data persists.

**Acceptance Scenarios**:

1. **Given** I am a new user, **When** I sign up with email/password, **Then** an account is created and I see onboarding
2. **Given** I have an account, **When** I log in with correct credentials, **Then** I see my dashboard with my habitanimals
3. **Given** I am logged in, **When** I close and reopen the app, **Then** I remain logged in (session persistence)

---

### User Story 5 - Whoop Integration (Priority: P2)

As a Whoop user, I want to connect my account so sleep and workout data automatically updates my habitanimals.

**Why this priority**: High value for target users, but app works without it (manual entry fallback).

**Independent Test**: Can be tested by connecting Whoop, sleeping, and verifying sleep data appears and affects Schlaf-Habitanimal.

**Acceptance Scenarios**:

1. **Given** I want to connect Whoop, **When** I go to Settings > Integrations, **Then** I see a "Connect Whoop" button
2. **Given** I authorize Whoop, **When** connection succeeds, **Then** my last 7 days of sleep/recovery data syncs
3. **Given** Whoop is connected, **When** new sleep data is available, **Then** my Schlaf-Habitanimal automatically gains/loses health based on sleep quality
4. **Given** Whoop reports high Strain, **When** data syncs, **Then** my Kraft-Habitanimal gains bonus XP

---

### User Story 6 - Habitanimal Leveling & Evolution (Priority: P2)

As a user, I want to see my habitanimals level up and evolve at milestones, so I have long-term goals.

**Why this priority**: Important for retention, but basic XP display is sufficient for MVP launch.

**Independent Test**: Can be tested by accumulating XP to level 10 and observing evolution animation.

**Acceptance Scenarios**:

1. **Given** my habitanimal is Level 9, **When** it gains enough XP to reach Level 10, **Then** it evolves with a celebration animation
2. **Given** my habitanimal evolves, **When** I view its profile, **Then** I see its new form and updated stats
3. **Given** my habitanimal is max level for current evolution, **When** I view progress, **Then** I see progress toward next evolution milestone

---

### User Story 7 - Habit Categories & Habitanimal Assignment (Priority: P2)

As a user, I want each habit linked to a specific habitanimal, so completing habits benefits the right habitanimal.

**Why this priority**: Necessary for the habitanimal system to work properly, but can use defaults initially.

**Independent Test**: Can be tested by creating habits in different categories and verifying correct habitanimal receives XP.

**Acceptance Scenarios**:

1. **Given** I create a "Morning Run" habit, **When** I assign it to Fitness, **Then** completing it gives XP to Kraft-Habitanimal
2. **Given** I have the 5 default habitanimals, **When** I view habit creation, **Then** I can assign to: Fitness, Mindfulness, Nutrition, Sleep, Learning
3. **Given** I complete a Sleep habit manually, **When** Whoop is also connected, **Then** both sources contribute to Schlaf-Habitanimal

---

### User Story 8 - Habit Stacking Combos (Priority: P3)

As a user, I want bonus rewards when I complete related habits in sequence, so I'm encouraged to build routines.

**Why this priority**: Nice-to-have that increases engagement, but core loop works without it.

**Independent Test**: Can be tested by completing morning routine habits in sequence and verifying combo bonus.

**Acceptance Scenarios**:

1. **Given** I complete "Wake up early" then "Meditate" within 30 minutes, **When** both complete, **Then** I receive a "Morning Combo" bonus
2. **Given** I trigger a combo, **When** viewing the dashboard, **Then** I see a combo notification with bonus XP amount
3. **Given** I complete habits out of sequence, **When** checking rewards, **Then** I get normal XP (no combo penalty)

---

### Edge Cases

- What happens when Whoop API is unavailable? → Show error, allow manual entry, retry later
- What happens when user has no habits configured? → Show onboarding prompt to create first habit
- What happens when habitanimal health reaches 0? → Habitanimal appears very sad but doesn't "die", encourages recovery
- What happens on timezone change (travel)? → Use local device time, grace period for habit completion
- What happens when user deletes a habit mid-streak? → Habitanimal keeps earned XP, habit history preserved

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication**
- **FR-001**: System MUST allow users to create accounts with email and password
- **FR-002**: System MUST securely hash and store passwords (bcrypt or similar)
- **FR-003**: System MUST support persistent sessions (7+ days)
- **FR-004**: System MUST allow password reset via email

**Habits**
- **FR-010**: System MUST allow users to create custom habits with name, category, and optional details
- **FR-011**: System MUST provide 5 default habit categories: Fitness, Mindfulness, Nutrition, Sleep, Learning
- **FR-012**: System MUST allow users to mark habits complete with single tap
- **FR-013**: System MUST allow optional detail entry (duration, quantity, notes)
- **FR-014**: System MUST track habit completion history with timestamps

**Habitanimals**
- **FR-020**: System MUST create 5 starter habitanimals for each new user:
  - Guiro (Gorilla 🦍) → Fitness
  - Zen (Schildkröte 🐢) → Mindfulness
  - Greeny (Ochs 🐂) → Nutrition
  - Milo (Faultier 🦥) → Sleep
  - Finn (Fuchs 🦊) → Learning
- **FR-021**: System MUST calculate habitanimal XP based on habit completions
- **FR-022**: System MUST update habitanimal health based on habit consistency (Never Miss Twice logic)
- **FR-023**: System MUST level up habitanimals when XP threshold reached
- **FR-024**: System MUST evolve habitanimals at milestone levels (10, 25, 50)
- **FR-025**: System MUST persist habitanimal state (health, XP, level, evolution stage)

**Whoop Integration**
- **FR-030**: System MUST allow OAuth connection to Whoop API
- **FR-031**: System MUST fetch sleep data (duration, quality, HRV, recovery score)
- **FR-032**: System MUST fetch strain data (workout intensity)
- **FR-033**: System MUST map Whoop data to appropriate habitanimal XP/health
- **FR-034**: System MUST handle Whoop API failures gracefully (fallback to manual)

**Dashboard**
- **FR-040**: System MUST display today's habits with completion status
- **FR-041**: System MUST display all 5 habitanimals with current health/level
- **FR-042**: System MUST show habitanimal mood/state visually (happy, tired, sad)
- **FR-043**: System MUST update in real-time when habits are completed

### Key Entities

- **User**: Account holder with email, password hash, settings, created_at
- **Habit**: User-defined trackable action with name, category, frequency, created_at
- **HabitCompletion**: Record of habit done with timestamp, optional details, XP earned
- **Habitanimal**: Virtual companion with type, species (gorilla/turtle/ox/sloth/fox), name (Guiro/Zen/Greeny/Milo/Finn), level, XP, health, evolution_stage, user_id
- **WhoopConnection**: OAuth tokens, last_sync, user_id

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete account creation and see dashboard in under 60 seconds
- **SC-002**: Users can mark a habit complete in under 2 seconds (single tap)
- **SC-003**: Habitanimal visual state updates within 1 second of habit completion
- **SC-004**: Whoop data syncs within 5 minutes of new data availability
- **SC-005**: Dashboard loads in under 2 seconds on average connection
- **SC-006**: System handles 100 concurrent users without degradation (MVP scale)
- **SC-007**: 80% of test users understand the habitanimal health system without explanation
- **SC-008**: Users who connect Whoop show 30% higher 7-day retention than manual-only users
