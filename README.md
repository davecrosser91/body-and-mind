# Body & Mind

A gamified habit-tracking app built on one simple principle: **reach 100 points for your body and 100 points for your mind each day.**

> "Self-care is not selfish. You cannot serve from an empty vessel."
> — Eleanor Brown

## Table of Contents

- [Philosophy](#philosophy)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Architecture Highlights](#architecture-highlights)
- [Contributing](#contributing)
- [License](#license)

---

## Philosophy

Most habit apps overwhelm you with endless streaks, unforgiving goals, and guilt. Body & Mind takes a different approach:

| Principle | Description |
|-----------|-------------|
| **Two Pillars** | Body (Training, Sleep, Nutrition) and Mind (Meditation, Reading, Learning, Journaling) |
| **Points Over Checkboxes** | 100 points per pillar = daily completion. Mix and match activities to hit your target. |
| **Habit Stacking** | Chain activities together for bonus points and momentum |
| **Streaks That Reward** | Progressive multipliers (+5% per day, up to 50%) without punishing missed days |

---

## Features

### Core
- **Daily Balance Dashboard** - Visual score rings showing Body & Mind progress toward 100 points
- **Flexible Activities** - Create custom activities with configurable point values (default: 25 pts)
- **Habit Stacking** - Chain 2+ habits into routines with completion bonuses (up to +100%)
- **Streak System** - Build momentum with daily multipliers that compound your points

### Integrations
- **Whoop Sync** - Auto-import recovery scores, sleep data, and workouts via OAuth
- **Auto-Triggers** - Automatically complete habits based on Whoop metrics (e.g., "Log sleep if hours > 7")

### Experience
- **Premium Dark UI** - Minimalist design with smooth Framer Motion animations
- **Personalized Recommendations** - Suggestions based on recovery status and streak urgency
- **Subcategory Dashboards** - Drill into Training, Sleep, Meditation, and more

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS 4, Framer Motion |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Database** | PostgreSQL |
| **Auth** | NextAuth.js with JWT (7-day tokens, bcrypt hashing) |
| **Integrations** | Whoop API (OAuth 2.0) |
| **Testing** | Vitest (unit), Playwright (E2E) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (or use Docker)
- (Optional) Whoop developer account for integration

### Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/routine-game.git
cd routine-game
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials (see Environment Variables below)

# Start PostgreSQL (if using Docker)
docker-compose up -d

# Setup database
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

### Environment Variables

Create a `.env.local` file with the following:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5433/habit_animals"

# Auth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Whoop Integration (optional)
WHOOP_CLIENT_ID="your-whoop-client-id"
WHOOP_CLIENT_SECRET="your-whoop-client-secret"
```

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio GUI |

### Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth pages (login, signup, onboarding)
│   ├── (dashboard)/       # Main app pages
│   │   ├── dashboard/     # Home dashboard
│   │   ├── body/          # Body pillar page
│   │   ├── mind/          # Mind pillar page
│   │   ├── stacks/        # Habit stack management
│   │   ├── insights/      # Analytics & history
│   │   └── settings/      # User settings
│   └── api/v1/            # REST API endpoints
├── components/            # React components (57+)
│   ├── activities/        # Activity logging
│   ├── dashboard/         # Dashboard sections
│   ├── scores/            # Score rings & breakdowns
│   ├── stacks/            # Stack cards & chains
│   ├── whoop/             # Whoop integration UI
│   └── ui/                # Shared UI components
├── lib/                   # Business logic
│   ├── auth.ts           # JWT handling
│   ├── points.ts         # Points calculation
│   ├── streaks.ts        # Streak logic
│   ├── habit-stacks.ts   # Stack operations
│   ├── auto-trigger.ts   # Auto-completion rules
│   └── whoop-sync.ts     # Whoop data sync
├── contexts/              # React contexts (Auth, Toast)
├── hooks/                 # Custom hooks (useAuth, useDashboard)
└── types/                 # TypeScript definitions
```

---

## API Documentation

All API endpoints are prefixed with `/api/v1`. Authentication is required for most endpoints via Bearer token in the `Authorization` header.

> **Interactive Docs**: Visit `/docs` when running the dev server for Swagger UI exploration.

### Response Format

All responses follow a standard format:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Endpoints Overview

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Auth** | `/auth/signup`, `/auth/login`, `/auth/me` | User registration and authentication |
| **Activities** | `/activities`, `/activities/:id/complete` | CRUD operations and completions |
| **Stacks** | `/stacks`, `/stacks/:id/execute` | Habit stack management |
| **Status** | `/daily-status`, `/streaks` | Daily progress and streak data |
| **Whoop** | `/integrations/whoop/*` | OAuth connection and sync |
| **Other** | `/recommendations`, `/weights`, `/health` | Personalization and system |

---

### Authentication

#### `POST /api/v1/auth/signup`
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." },
    "token": "jwt_token_here"
  }
}
```

#### `POST /api/v1/auth/login`
Authenticate an existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." },
    "token": "jwt_token_here"
  }
}
```

#### `GET /api/v1/auth/me`
Get current user profile. Requires authentication.

---

### Activities

Activities are individual tasks/habits that belong to either the Body or Mind pillar.

#### `GET /api/v1/activities`
List all activities for the authenticated user.

**Query Parameters:**
- `pillar` - Filter by pillar: `BODY` or `MIND`
- `subCategory` - Filter by subcategory: `TRAINING`, `SLEEP`, `NUTRITION`, `MEDITATION`, `READING`, `LEARNING`, `JOURNALING`
- `habitsOnly` - If `true`, only return activities where `isHabit = true`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123...",
      "name": "Morning Meditation",
      "pillar": "MIND",
      "subCategory": "MEDITATION",
      "frequency": "DAILY",
      "points": 25,
      "isHabit": true,
      "cueType": "TIME",
      "cueValue": "07:00",
      "description": "10 minutes of mindfulness"
    }
  ]
}
```

#### `POST /api/v1/activities`
Create a new activity.

**Request:**
```json
{
  "name": "Morning Workout",
  "pillar": "BODY",
  "subCategory": "TRAINING",
  "points": 50,
  "isHabit": true,
  "frequency": "DAILY",
  "cueType": "TIME",
  "cueValue": "06:30",
  "description": "30-minute strength training"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Activity name |
| `pillar` | string | Yes | `BODY` or `MIND` |
| `subCategory` | string | Yes | Category within pillar |
| `points` | number | No | Points earned (default: 25) |
| `isHabit` | boolean | No | Is this a recurring habit? (default: false) |
| `frequency` | string | No | `DAILY`, `WEEKLY`, or `CUSTOM` (default: DAILY) |
| `cueType` | string | No | `TIME`, `LOCATION`, or `AFTER_ACTIVITY` |
| `cueValue` | string | No | Cue details (e.g., "07:00" for TIME) |
| `description` | string | No | Optional description |

#### `POST /api/v1/activities/:id/complete`
Mark an activity as completed.

**Request (optional):**
```json
{
  "details": "Completed 30 minutes",
  "source": "MANUAL"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "completion_id",
    "activityId": "activity_id",
    "completedAt": "2024-01-15T07:30:00.000Z",
    "pointsEarned": 50
  }
}
```

#### `DELETE /api/v1/activities/:id/complete`
Remove today's completion for an activity.

---

### Daily Status

#### `GET /api/v1/daily-status`
Get comprehensive daily status including Body/Mind scores, streak info, and Whoop recovery.

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "body": {
      "completed": true,
      "score": 70,
      "activities": [
        {
          "id": "...",
          "name": "Morning Workout",
          "category": "TRAINING",
          "completedAt": "2024-01-15T07:30:00.000Z"
        }
      ]
    },
    "mind": {
      "completed": false,
      "score": 0,
      "activities": []
    },
    "streak": {
      "current": 5,
      "atRisk": true,
      "hoursRemaining": 8.5
    },
    "recovery": {
      "score": 72,
      "zone": "green",
      "recommendation": "Your body is well recovered. Great day for intense training!"
    },
    "quote": {
      "text": "The only bad workout is the one that didn't happen.",
      "author": null
    }
  }
}
```

---

### Streaks

#### `GET /api/v1/streaks`
Get streak information for all pillars.

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "current": 5,
      "longest": 14,
      "lastActiveDate": "2024-01-14",
      "atRisk": true,
      "hoursRemaining": 8.5
    },
    "body": {
      "current": 7,
      "longest": 20,
      "lastActiveDate": "2024-01-15",
      "atRisk": false,
      "hoursRemaining": 8.5
    },
    "mind": {
      "current": 5,
      "longest": 14,
      "lastActiveDate": "2024-01-14",
      "atRisk": true,
      "hoursRemaining": 8.5
    }
  }
}
```

---

### Habit Stacks

Habit stacks chain multiple activities together for bonus points.

#### `GET /api/v1/stacks`
List all habit stacks.

**Response:**
```json
{
  "success": true,
  "data": {
    "stacks": [
      {
        "id": "...",
        "name": "Morning Routine",
        "description": "Start the day right",
        "activityIds": ["act1", "act2", "act3"],
        "activities": [
          { "id": "act1", "name": "Meditation", "pillar": "MIND", "points": 25 },
          { "id": "act2", "name": "Workout", "pillar": "BODY", "points": 50 },
          { "id": "act3", "name": "Journaling", "pillar": "MIND", "points": 25 }
        ],
        "cueType": "TIME",
        "cueValue": "06:00",
        "isActive": true,
        "completionBonus": 20,
        "currentStreak": 5
      }
    ],
    "activeCount": 1,
    "totalActivitiesInStacks": 3
  }
}
```

#### `POST /api/v1/stacks`
Create a new habit stack.

**Request:**
```json
{
  "name": "Morning Routine",
  "description": "Start the day right",
  "activityIds": ["activity_id_1", "activity_id_2"],
  "cueType": "TIME",
  "cueValue": "06:00",
  "completionBonus": 20
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Stack name |
| `activityIds` | string[] | Yes | At least 2 activity IDs in order |
| `description` | string | No | Optional description |
| `cueType` | string | No | `TIME`, `LOCATION`, or `AFTER_ACTIVITY` |
| `cueValue` | string | No | Cue details |
| `completionBonus` | number | No | Bonus percentage (0-100, default: 20) |

#### `PUT /api/v1/stacks/:id`
Update a habit stack.

#### `DELETE /api/v1/stacks/:id`
Delete a habit stack.

#### `POST /api/v1/stacks/:id/execute`
Mark a stack as completed (completes all activities and awards bonus).

---

### Whoop Integration

#### `GET /api/v1/integrations/whoop`
Get Whoop connection status.

#### `GET /api/v1/integrations/whoop/connect`
Get OAuth URL to connect Whoop account.

#### `GET /api/v1/integrations/whoop/callback`
OAuth callback handler (used internally).

#### `POST /api/v1/integrations/whoop/sync`
Manually trigger Whoop data sync.

#### `DELETE /api/v1/integrations/whoop`
Disconnect Whoop account.

---

### Other Endpoints

#### `GET /api/v1/recommendations`
Get personalized recommendations based on recovery, streaks, and progress.

#### `GET /api/v1/weights`
Get pillar category weights for score calculation.

#### `PUT /api/v1/weights`
Update pillar category weights.

#### `GET /api/v1/health`
Health check endpoint (no auth required).

---

## Architecture Highlights

### Points System
- **100 points** per pillar (Body/Mind) = daily completion
- Default activity value: **25 points** (4 activities to complete a pillar)
- Streak maintained only when **both pillars** reach 100 points

### Streak Multipliers
| Days | Bonus |
|------|-------|
| 1 | +5% |
| 5 | +25% |
| 10+ | +50% (max) |

### Whoop Auto-Triggers
Configure automatic habit completion based on:
- `WHOOP_RECOVERY_ABOVE/BELOW` - Recovery score thresholds
- `WHOOP_SLEEP_ABOVE` - Sleep duration
- `WHOOP_STRAIN_ABOVE` - Daily strain
- `WHOOP_WORKOUT_TYPE` - Specific workout types
- `ACTIVITY_COMPLETED` - Chain completions

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code:
- Passes all existing tests (`npm run test`)
- Follows the existing code style (`npm run lint`)
- Includes tests for new functionality

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with care for balance, not burnout.
