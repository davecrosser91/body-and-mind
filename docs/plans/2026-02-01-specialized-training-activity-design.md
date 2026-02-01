# Specialized Training Activity Design

> Design document for enhanced Training activity logging with richer workout data, templates, and integration support.

## Overview

Replace the generic activity logging experience for Training with a specialized flow that:

1. Surfaces Whoop-detected workouts (and future integrations) for quick logging
2. Provides reusable templates for common workouts
3. Captures rich, optional workout metadata (type, duration, intensity, exercises, etc.)
4. Allows linking external workouts to existing saved habits

## Entry Flow

When logging a Training activity, users see a specialized modal with three paths:

```
┌─────────────────────────────────────────┐
│  Log Training                        ✕  │
├─────────────────────────────────────────┤
│                                         │
│  📡 FROM WHOOP (if available)           │
│  ┌─────────────────────────────────┐    │
│  │ 🏋️ Strength Training    45 min │    │
│  │ Strain: 14.2 • 10:30 AM        │    │
│  │                                 │    │
│  │ [Log as New] [Link to Habit ▼] │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ⚡ QUICK TEMPLATES                     │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │Morning │ │Zone 2  │ │ HIIT   │      │
│  │Strength│ │  Run   │ │Session │      │
│  │ 50 pts │ │ 35 pts │ │ 45 pts │      │
│  └────────┘ └────────┘ └────────┘      │
│                                         │
│  ─────────── or ───────────            │
│                                         │
│  [ + Custom Workout ]                   │
│                                         │
└─────────────────────────────────────────┘
```

### Path 1: External Integration (Whoop, etc.)

- Only shown when an unlogged workout is detected from a connected integration
- **"Log as New"**: Opens workout detail form pre-filled with integration data
- **"Link to Habit"**: Dropdown of existing Training habits; selecting one completes that habit and attaches the integration data

### Path 2: Quick Templates

- Shows saved workout templates as tappable chips
- Tapping opens workout detail form pre-filled with template defaults
- User can edit any field before logging

### Path 3: Custom Workout

- Opens blank workout detail form
- Full manual entry

## Workout Detail Form

### Layout

```
┌─────────────────────────────────────────┐
│  ← Workout Details                      │
├─────────────────────────────────────────┤
│                                         │
│  Name *                                 │
│  ┌─────────────────────────────────┐    │
│  │ Morning Strength Session        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Workout Type                           │
│  ┌──────┐┌──────┐┌──────┐┌──────┐      │
│  │Strngth││Cardio││ HIIT ││ Yoga │      │
│  └──────┘└──────┘└──────┘└──────┘      │
│  ┌──────┐┌──────┐┌──────┐┌──────┐      │
│  │Sports││ Walk ││Stretch││Other │      │
│  └──────┘└──────┘└──────┘└──────┘      │
│                                         │
│  Duration            Intensity          │
│  ┌───────────┐      ┌───────────┐       │
│  │  45 min   │      │   Hard    │       │
│  └───────────┘      └───────────┘       │
│                                         │
│  ▼ More Details (tap to expand)         │
│                                         │
│  Points *                               │
│  ┌──────┐┌──────┐┌──────┐┌──────┐      │
│  │  10  ││  25  ││  50  ││ 100  │      │
│  │Light ││ Reg  ││●Impt ││Essntl│      │
│  └──────┘└──────┘└──────┘└──────┘      │
│  ───────────●──────────── 50 pts       │
│                                         │
│  Notes                                  │
│  ┌─────────────────────────────────┐    │
│  │ Felt strong today, PR on squats │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ☐ Save as template for future use     │
│                                         │
│  [  Cancel  ]  [  Log Workout  ]        │
│                                         │
└─────────────────────────────────────────┘
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Workout name |
| Workout Type | No | STRENGTH, CARDIO, HIIT, YOGA, SPORTS, WALK, STRETCH, OTHER |
| Duration | No | Minutes |
| Intensity | No | LIGHT, MODERATE, HARD, MAX |
| Points | Yes | Manual entry (presets + slider, same as current) |
| Notes | No | Free text |
| Save as template | No | Checkbox to save for future use |

### Expanded "More Details" Section

Collapsed by default. When expanded:

```
┌─────────────────────────────────────────┐
│  ▲ More Details                         │
├─────────────────────────────────────────┤
│                                         │
│  Muscle Groups (multi-select)           │
│  ┌──────┐┌──────┐┌──────┐┌──────┐      │
│  │Upper ││Lower ││ Core ││ Full │      │
│  │  ●   ││      ││  ●   ││ Body │      │
│  └──────┘└──────┘└──────┘└──────┘      │
│                                         │
│  Exercises                              │
│  ┌─────────────────────────────────┐    │
│  │ Squats         3x8    [Delete] │    │
│  │ Bench Press    4x6    [Delete] │    │
│  └─────────────────────────────────┘    │
│  [ + Add Exercise ]                     │
│                                         │
│  RPE (Rate of Perceived Effort)         │
│  ○ ○ ○ ○ ○ ○ ● ○ ○ ○                    │
│  1 2 3 4 5 6 7 8 9 10                   │
│                                         │
│  Location                               │
│  ┌──────┐┌──────┐┌──────┐┌──────┐      │
│  │ Gym  ││ Home ││Outdor││Other │      │
│  └──────┘└──────┘└──────┘└──────┘      │
│                                         │
│  Heart Rate (from integration or manual)│
│  ┌─────────┐  ┌─────────┐               │
│  │Avg: 142 │  │Max: 172 │  bpm          │
│  └─────────┘  └─────────┘               │
│                                         │
│  HR Zones (read-only, from integration) │
│  ▓▓▓▓░░░░░░ Z1  12 min                 │
│  ▓▓▓▓▓▓▓░░░ Z2  18 min                 │
│  ▓▓▓▓▓░░░░░ Z3  10 min                 │
│  ▓▓░░░░░░░░ Z4   5 min                 │
│  ░░░░░░░░░░ Z5   0 min                 │
│                                         │
└─────────────────────────────────────────┘
```

| Field | Required | Description |
|-------|----------|-------------|
| Muscle Groups | No | Multi-select: UPPER, LOWER, CORE, FULL_BODY |
| Exercises | No | List of exercises with sets/reps |
| RPE | No | 1-10 scale |
| Location | No | GYM, HOME, OUTDOOR, OTHER |
| Avg Heart Rate | No | From integration or manual |
| Max Heart Rate | No | From integration or manual |
| HR Zones | No | Read-only visualization when integration data exists |

## Template Management

### Quick Save (Post-Log)

After logging a workout, show success toast:

```
┌─────────────────────────────────────────┐
│ ✓ Workout logged! +50 pts               │
│                                         │
│   [Save as Template]   [Done]           │
└─────────────────────────────────────────┘
```

Tapping "Save as Template":

```
┌─────────────────────────────────────────┐
│  Save as Template                    ✕  │
├─────────────────────────────────────────┤
│                                         │
│  Template Name                          │
│  ┌─────────────────────────────────┐    │
│  │ Morning Strength                │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ☑ Save as recurring habit              │
│    (shows in quick-log chips)           │
│                                         │
│  [  Cancel  ]  [  Save Template  ]      │
└─────────────────────────────────────────┘
```

### Template Management Screen

Accessible from Settings or Training subcategory page:

```
┌─────────────────────────────────────────┐
│  ← Training Templates                   │
├─────────────────────────────────────────┤
│                                         │
│  [ + Create New Template ]              │
│                                         │
│  MY TEMPLATES                           │
│  ┌─────────────────────────────────┐    │
│  │ 🏋️ Morning Strength      50 pts│    │
│  │ Strength • Upper, Core • Gym   │    │
│  │ Used 12x        [Edit] [Delete]│    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🏃 Zone 2 Run            35 pts│    │
│  │ Cardio • Outdoor               │    │
│  │ Used 8x         [Edit] [Delete]│    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

- **Create New**: Opens blank workout detail form
- **Edit**: Opens workout detail form with all fields editable
- **Delete**: Confirmation dialog, then removes template
- **Used Nx**: Shows usage count for insights

## Data Model

### New: TrainingDetails

Extends Activity for TRAINING subcategory with workout-specific data.

```prisma
model TrainingDetails {
  id                String    @id @default(cuid())
  activityId        String    @unique
  Activity          Activity  @relation(fields: [activityId], references: [id], onDelete: Cascade)

  // Workout attributes (all optional)
  workoutType       String?   // STRENGTH, CARDIO, HIIT, YOGA, SPORTS, WALK, STRETCH, OTHER
  durationMinutes   Int?
  intensity         String?   // LIGHT, MODERATE, HARD, MAX
  muscleGroups      String[]  // UPPER, LOWER, CORE, FULL_BODY
  location          String?   // GYM, HOME, OUTDOOR, OTHER
  rpe               Int?      // 1-10

  // Biometrics
  avgHeartRate      Int?
  maxHeartRate      Int?
  hrZones           Json?     // { z1: minutes, z2: minutes, ... }
  calories          Int?
  distance          Float?    // meters

  // Integration-agnostic fields
  source            String?   // MANUAL, WHOOP, APPLE_HEALTH, GARMIN, STRAVA, etc.
  externalWorkoutId String?   // ID from external system
  externalData      Json?     // Raw payload from source

  // Exercises relation
  exercises         Exercise[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([activityId])
  @@index([source])
}
```

### New: Exercise

Optional exercise tracking within a workout.

```prisma
model Exercise {
  id                 String          @id @default(cuid())
  trainingDetailsId  String
  TrainingDetails    TrainingDetails @relation(fields: [trainingDetailsId], references: [id], onDelete: Cascade)

  name               String
  sets               Int?
  reps               String?         // "8" or "60s" for time-based
  weight             Float?          // kg or lbs based on user preference
  notes              String?
  order              Int             @default(0)

  createdAt          DateTime        @default(now())

  @@index([trainingDetailsId])
}
```

### Updated: Source Enum

Extend to support future integrations:

```prisma
enum Source {
  MANUAL
  WHOOP
  APPLE_HEALTH
  GARMIN
  STRAVA
  FITBIT
  OTHER
}
```

### New: WorkoutType Enum

```prisma
enum WorkoutType {
  STRENGTH
  CARDIO
  HIIT
  YOGA
  SPORTS
  WALK
  STRETCH
  OTHER
}
```

### New: Intensity Enum

```prisma
enum Intensity {
  LIGHT
  MODERATE
  HARD
  MAX
}
```

### New: MuscleGroup Enum

```prisma
enum MuscleGroup {
  UPPER
  LOWER
  CORE
  FULL_BODY
}
```

### New: Location Enum

```prisma
enum Location {
  GYM
  HOME
  OUTDOOR
  OTHER
}
```

## API Endpoints

### Training-Specific Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/training/templates` | List user's training templates |
| POST | `/api/v1/training/templates` | Create a new template |
| PUT | `/api/v1/training/templates/:id` | Update a template |
| DELETE | `/api/v1/training/templates/:id` | Delete a template |
| GET | `/api/v1/training/external-workouts` | Get unlogged workouts from integrations |
| POST | `/api/v1/training/link-external` | Link external workout to existing habit |

### Modified Endpoints

| Method | Endpoint | Change |
|--------|----------|--------|
| POST | `/api/v1/activities` | Accept optional `trainingDetails` object for TRAINING activities |
| POST | `/api/v1/activities/:id/complete` | Accept optional `trainingDetails` for completion enrichment |

## Component Structure

```
src/components/training/
├── TrainingLogModal.tsx          # Main entry modal (replaces generic for TRAINING)
├── WorkoutDetailForm.tsx         # Full workout form with all fields
├── ExternalWorkoutCard.tsx       # Whoop/integration workout display
├── TemplateChip.tsx              # Quick template button
├── MoreDetailsSection.tsx        # Expandable details section
├── ExerciseList.tsx              # Exercise tracking UI
├── HRZonesDisplay.tsx            # Heart rate zones visualization
├── TemplateManagement/
│   ├── TemplateListPage.tsx      # Template management screen
│   ├── TemplateCard.tsx          # Individual template display
│   └── SaveTemplateModal.tsx     # Quick save modal
└── hooks/
    ├── useTrainingTemplates.ts   # Template CRUD operations
    └── useExternalWorkouts.ts    # Fetch unlogged external workouts
```

## Implementation Notes

### Linking External Workouts to Habits

When user selects "Link to Habit":

1. Find the selected Activity (must be `isHabit: true`, `subCategory: TRAINING`)
2. Create `ActivityCompletion` for today with the Activity's points
3. Create `TrainingDetails` linked to the Activity with integration data
4. Mark integration workout as "logged" to prevent duplicate display

### Template Storage

Templates are stored as regular `Activity` records with:
- `isHabit: true`
- `subCategory: TRAINING`
- Linked `TrainingDetails` with default workout attributes

### Backward Compatibility

- Existing Training activities without `TrainingDetails` continue to work
- Generic `ActivityLogModal` still available for other subcategories
- `TrainingDetails` is optional—users can log simple Training activities if preferred

## Future Considerations

1. **Apple Health Integration**: Use same `source`/`externalWorkoutId`/`externalData` pattern
2. **Strava/Garmin**: Same pattern, may include additional fields like route data
3. **Exercise Library**: Pre-built exercise database for autocomplete
4. **Workout Analytics**: Insights page showing volume, frequency, progress over time
5. **AI Recommendations**: Suggest rest days based on training load and recovery
