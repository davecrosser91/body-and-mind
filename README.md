# Body & Mind

A minimalist habit-tracking app built on one simple principle: **do at least one thing for your body and one thing for your mind each day.**

> "Self-care is not selfish. You cannot serve from an empty vessel."
> — Eleanor Brown

## Philosophy

Most habit apps overwhelm you with streaks, goals, and guilt. Body & Mind takes a different approach:

- **Two Pillars**: Body (Training, Sleep, Nutrition) and Mind (Meditation, Reading, Learning, Journaling)
- **One Simple Goal**: Complete at least one activity from each pillar daily
- **Habit Stacking**: Chain activities together for bonus points and momentum
- **Streaks That Forgive**: Build consistency without the anxiety of losing everything

## Features

- **Daily Balance** - Track your Body & Mind scores with a simple, visual dashboard
- **Habit Stacking** - Chain habits together into powerful routines with completion bonuses
- **Streak System** - Progressive multipliers reward consistency (+5% per day, max 50%)
- **Whoop Integration** - Auto-sync sleep and workout data (optional)
- **Dark Mode** - Easy on the eyes, beautiful to use

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS 4, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT-based authentication

## Getting Started

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## API Documentation

All API endpoints are prefixed with `/api/v1`. Authentication is required for most endpoints via Bearer token in the `Authorization` header.

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

## Interactive API Docs

Swagger UI is available at `/docs` when running the dev server for interactive API exploration.

## License

MIT
