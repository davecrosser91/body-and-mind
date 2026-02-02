# Mind Activities Design - Meditation & Journaling

## Overview

Specialized activity logging for the Mind pillar, following the Training activity pattern. Enables detailed meditation tracking with Whoop integration and full journaling with history browsing.

## Components

### 1. MeditationLogModal

**Flow:**
1. Selection View - shows:
   - "Your Meditation Habits" - existing habits (primary)
   - "From Whoop" - unlogged meditation/breathwork sessions
   - "Custom Meditation" button

2. Detail Form:
   - Duration (presets: 5, 10, 15, 20, 30 min + slider)
   - Technique (Breathing, Guided, Body Scan, Mindfulness, Visualization, Mantra, Other)
   - Mood Before (emoji: 😫 😕 😐 🙂 😊)
   - Mood After (same)
   - Guided App (optional: Headspace, Calm, Whoop, Other)
   - Notes (optional)
   - Points (locked when logging against habit)

### 2. JournalingLogModal

**Flow:**
1. Selection View:
   - "Your Journaling Habits" - existing habits (primary)
   - "New Entry" button

2. Entry Form:
   - Entry Type (Gratitude, Reflection, Free Write, Morning Pages, Evening Review)
   - Mood (emoji picker)
   - Content (large textarea with contextual placeholder)
   - Word count (auto-calculated)
   - Points (locked when logging against habit)

### 3. Journal History View

**Route:** `/mind/journal`

**Features:**
- Filter by entry type, mood, date range
- Search entries
- Card list with preview
- Expand to read full entry
- Edit/delete functionality

### 4. Quick-Add Entry Points

**Mind FAB:**
- Floating action button (bottom-right)
- Opens menu: "Log Meditation" / "Write Journal Entry"
- Opens modal directly to form (skips habit selection)

**Dashboard Cards:**
- MeditationDashboard: "Start Meditation" card
- JournalingDashboard: "Start Writing" card with daily prompt

## Database Schema

```prisma
model MeditationDetails {
  id                   String              @id @default(cuid())
  activityCompletionId String              @unique
  activityCompletion   ActivityCompletion  @relation(fields: [activityCompletionId], references: [id], onDelete: Cascade)
  durationMinutes      Int
  technique            MeditationTechnique?
  moodBefore           Mood?
  moodAfter            Mood?
  guidedApp            String?
  notes                String?
  source               Source?
  externalId           String?
  createdAt            DateTime            @default(now())

  @@index([activityCompletionId])
}

model JournalEntry {
  id                   String              @id @default(cuid())
  activityCompletionId String              @unique
  activityCompletion   ActivityCompletion  @relation(fields: [activityCompletionId], references: [id], onDelete: Cascade)
  entryType            JournalEntryType
  mood                 Mood?
  content              String              @db.Text
  wordCount            Int
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt

  @@index([activityCompletionId])
  @@index([entryType])
  @@index([createdAt])
}

enum MeditationTechnique {
  BREATHING
  GUIDED
  BODY_SCAN
  MINDFULNESS
  VISUALIZATION
  MANTRA
  OTHER
}

enum JournalEntryType {
  GRATITUDE
  REFLECTION
  FREE_WRITE
  MORNING_PAGES
  EVENING_REVIEW
}

enum Mood {
  GREAT
  GOOD
  NEUTRAL
  LOW
  STRESSED
}
```

## API Endpoints

### Meditation
- `GET /api/v1/meditation/external` - Fetch Whoop meditation sessions
- `POST /api/v1/activities/[id]/complete` - Extended to handle meditationDetails

### Journaling
- `GET /api/v1/journal/entries` - List entries with filters
- `GET /api/v1/journal/entries/[id]` - Single entry
- `PUT /api/v1/journal/entries/[id]` - Update entry
- `DELETE /api/v1/journal/entries/[id]` - Delete entry

## Files to Create

### Meditation
- `src/components/meditation/MeditationLogModal.tsx`
- `src/components/meditation/MeditationDetailForm.tsx`
- `src/components/meditation/index.ts`
- `src/app/api/v1/meditation/external/route.ts`

### Journaling
- `src/components/journaling/JournalingLogModal.tsx`
- `src/components/journaling/JournalEntryForm.tsx`
- `src/components/journaling/JournalHistory.tsx`
- `src/components/journaling/JournalEntryCard.tsx`
- `src/components/journaling/index.ts`
- `src/app/(dashboard)/mind/journal/page.tsx`
- `src/app/api/v1/journal/entries/route.ts`
- `src/app/api/v1/journal/entries/[id]/route.ts`

### Shared
- `src/components/navigation/MindFAB.tsx`

### Updates
- `prisma/schema.prisma` - Add new models and enums
- `src/app/(dashboard)/mind/page.tsx` - Use new modals, add FAB
- `src/components/subcategories/MeditationDashboard.tsx` - Add quick-start card
- `src/components/subcategories/JournalingDashboard.tsx` - Add quick-start card
- `src/app/api/v1/activities/[id]/complete/route.ts` - Handle meditationDetails
