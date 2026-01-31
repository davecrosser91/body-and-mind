# BODY & MIND App Redesign

**Date:** 2025-01-31
**Status:** Approved for implementation

## Overview

Transform the app into "BODY & MIND" - a premium wellness app for Barcelona fitness lifestyle people. The core philosophy: **Every day, do something for your Body AND something for your Mind.**

## Core Concept

### The Daily Goal

- **Success Criteria:** Complete at least 1 Body activity AND 1 Mind activity daily
- **Streak:** Combined streak for both pillars (miss either = streak resets)
- **Scoring:** Points with user-configurable weights determine score quality
- **Minimum Bar:** Binary completion (did you do something for both?)

### The Promise

Simple, achievable, non-negotiable: Body + Mind every day. The app makes this obvious and tracks your consistency.

---

## Activities & Pillars

### Body Pillar

| Activity | Whoop Auto-Sync | Description |
|----------|-----------------|-------------|
| Training | ✓ | Workouts, exercise, movement |
| Sleep | ✓ | Sleep duration, quality, stages |
| Nutrition | ✗ (manual) | Meals, hydration, diet tracking |

### Mind Pillar

| Activity | Whoop Auto-Sync | Description |
|----------|-----------------|-------------|
| Meditation | ✓ (as workout type) | Breathwork, mindfulness |
| Reading | ✗ (manual) | Books, articles, pages |
| Learning | ✗ (manual) | Courses, skills, languages |

---

## Whoop Integration

### Auto-Synced Data

| Data Point | API Endpoint | Use in App |
|------------|--------------|------------|
| Workouts | `/activity/workout` | Training activity completion |
| Sleep | `/activity/sleep` | Sleep activity + quality score |
| Meditation | `/activity/workout` (filtered by type) | Mind activity completion |
| Recovery Score | `/recovery` | Intensity recommendations |
| HRV | `/recovery` | Stress/recovery trends |
| Resting HR | `/recovery` | Health baseline |

### Recovery-Aware Recommendations

```
Recovery 70-100% (Green):  "Great recovery! Push hard."
                          → Suggest intense workouts

Recovery 34-69% (Yellow):  "Take it easier today."
                          → Suggest light movement, yoga

Recovery 0-33% (Red):      "Focus on rest & Mind today."
                          → Suggest rest day, meditation, reading
```

---

## Points & Weight System

### How It Works

1. Each activity contributes points to its pillar score
2. User configures importance (weight) of each activity
3. Weights are percentages that sum to 100% per pillar
4. Daily score = weighted sum of completed activities

### Presets (Atomic Habits Inspired)

| Preset | Body Weights | Mind Weights | Best For |
|--------|--------------|--------------|----------|
| **Balanced** | Training 35%, Sleep 35%, Nutrition 30% | Meditation 40%, Reading 30%, Learning 30% | Starting out |
| **Athlete** | Training 50%, Sleep 35%, Nutrition 15% | Meditation 50%, Reading 25%, Learning 25% | Performance focus |
| **Recovery** | Training 20%, Sleep 50%, Nutrition 30% | Meditation 50%, Reading 30%, Learning 20% | Rest periods |
| **Knowledge** | Training 30%, Sleep 40%, Nutrition 30% | Meditation 20%, Reading 40%, Learning 40% | Learning focus |
| **Custom** | User-defined | User-defined | Advanced users |

### Slider Interface

- Sliders auto-balance to 100%
- Drag one up → others adjust proportionally
- "Lock" icon to freeze a value while adjusting others

---

## Habit Stacking (Atomic Habits)

### User-Defined Stacks

Users create chains of habits:
```
Morning: Wake → Hydrate → Workout → Meditate
Evening: Read → Journal → Sleep prep
```

Completing one activity prompts the next in the chain.

### Presets (Book-Inspired)

| Stack | Chain | Principle |
|-------|-------|-----------|
| **Morning Momentum** | Wake → Hydrate → Move → Meditate | Start strong |
| **Evening Wind-Down** | Read → Journal → Sleep prep | End mindfully |
| **The 2-Minute Start** | 2-min stretch, 1 page reading | Make it easy |
| **Temptation Bundling** | Podcast + Workout | Pair enjoyable with beneficial |

### Cue System

Optional triggers:
- Time-based: "At 7am → Morning workout"
- Location-based: "When I get home → Reading"
- Action-based: "After workout → Meditation"

---

## Streaks & Motivation

### Combined Streak

- **Rule:** Body ✓ + Mind ✓ = streak continues
- **Visual:** Ember bar that grows brighter with longer streaks
- **Milestones:** 7, 21, 66 days (habit formation science)

### Streak Urgency States

| State | Display | Action |
|-------|---------|--------|
| **Safe** | "Streak secured! 🔥" | Celebrate |
| **At Risk** | "⚠️ X hours left to save your 14-day streak!" | Show quick options |
| **Lost** | "Streak reset. Start fresh today." | Encourage restart |

### Quick Recovery Actions

When at risk, show easy "2-minute" options:
- [5min Meditate] [Read 1 page] [Quick stretch]

### Motivational Quotes Database

Rotating quotes instead of static text:
- "Don't break the chain"
- "Small steps every day"
- "You're one workout away from a good mood"
- "The body achieves what the mind believes"
- ... (database of 100+ quotes)

---

## Navigation & Dashboards

### Three-Level Structure

```
Home (Daily View)
├── Body Dashboard
│   ├── Training Detail
│   ├── Sleep Detail
│   └── Nutrition Detail
└── Mind Dashboard
    ├── Meditation Detail
    ├── Reading Detail
    └── Learning Detail
```

### Home Screen

```
┌─────────────────────────────────┐
│  BODY & MIND                    │
│                                 │
│      🔥 14 day streak           │
│   "{motivational quote}"        │
├─────────────────────────────────┤
│   ┌─────┐       ┌─────┐        │
│   │ 72  │       │  --  │        │
│   │BODY │       │MIND │        │
│   │  ✓  │       │  ✗  │        │
│   └─────┘       └─────┘        │
│                                 │
│  ⚠️ MIND incomplete             │
│  Your 14-day streak ends at    │
│  midnight! Do 1 Mind activity. │
│                                 │
│  Quick options:                 │
│  [5min Meditate] [Read 1 page] │
├─────────────────────────────────┤
│  Today's Stack:                 │
│  ✓ Workout  → ○ Meditate       │
└─────────────────────────────────┘
```

### Body Dashboard

- Body Score with breakdown (Training, Sleep, Nutrition)
- Today's Body activities (completed/pending)
- Weight configuration sliders
- Weekly trend chart
- Recovery status from Whoop

### Mind Dashboard

- Mind Score with breakdown (Meditation, Reading, Learning)
- Today's Mind activities
- Weight configuration sliders
- Weekly trend chart
- HRV correlation insights

### Sub-Category Detail (e.g., Training)

- History of activities (Whoop-synced + manual)
- Personal bests, trends
- Connected habit stacks
- Quick log button

---

## Branding

### App Name

**BODY & MIND**

### Logo

Abstract balance symbol - two halves forming a circle:
- Left half: Amber (#E8A854) - Body
- Right half: Teal (#5BCCB3) - Mind
- Minimal, works at all sizes

### Color Palette

| Purpose | Color | Hex |
|---------|-------|-----|
| Body | Amber | #E8A854 |
| Mind | Teal | #5BCCB3 |
| Background | Dark | #0D0D0F |
| Surface | Card | #1A1A1D |
| Text Primary | White | #FFFFFF |
| Text Muted | Gray | #6B7280 |

### Typography

- Clean sans-serif (Inter or similar)
- "BODY & MIND" in caps
- Ampersand emphasized

---

## API Design (Critical)

**Everything must be API-accessible** for AI assistant integration (Claude bot) and future extensibility.

### Core Endpoints

#### Daily Status
```
GET /api/v1/daily-status
Response: {
  date: "2025-01-31",
  body: { completed: true, score: 72, activities: [...] },
  mind: { completed: false, score: 0, activities: [] },
  streak: { current: 14, atRisk: true, hoursRemaining: 6 },
  recovery: { score: 85, zone: "green", recommendation: "Push hard" }
}
```

#### Log Activity
```
POST /api/v1/activities
Body: {
  pillar: "BODY" | "MIND",
  category: "TRAINING" | "SLEEP" | "NUTRITION" | "MEDITATION" | "READING" | "LEARNING",
  duration?: number,
  details?: string,
  source: "manual" | "whoop" | "api"
}
```

#### Get Recommendations
```
GET /api/v1/recommendations
Response: {
  recovery: { score: 85, suggestion: "Great day for intense workout" },
  streakStatus: { atRisk: true, quickActions: ["5min meditation", "Read 1 page"] },
  nextInStack: { activity: "Meditate", afterCompleting: "Workout" },
  quote: "Don't break the chain"
}
```

#### Weight Configuration
```
GET /api/v1/weights
PUT /api/v1/weights
Body: {
  body: { training: 50, sleep: 35, nutrition: 15 },
  mind: { meditation: 40, reading: 30, learning: 30 },
  preset: "athlete" | "balanced" | "recovery" | "knowledge" | "custom"
}
```

#### Habit Stacks
```
GET /api/v1/stacks
POST /api/v1/stacks
PUT /api/v1/stacks/:id
DELETE /api/v1/stacks/:id
Body: {
  name: "Morning Momentum",
  activities: ["TRAINING", "MEDITATION", "READING"],
  cue: { type: "time", value: "07:00" }
}
```

#### Streak & History
```
GET /api/v1/streak
GET /api/v1/history?from=2025-01-01&to=2025-01-31
GET /api/v1/insights
```

### AI Assistant Integration

The API enables Claude (or any assistant) to:
- Check daily status: "Have you done your Mind activity today?"
- Give recommendations: "Your recovery is low, maybe just read today"
- Log activities: "I'll log that 10-minute meditation for you"
- Motivate: "You're 2 hours away from losing a 14-day streak!"
- Suggest next action: "You finished your workout, time for meditation?"

### Webhook Support (Future)

```
POST /api/v1/webhooks
Events: activity.completed, streak.atrisk, streak.lost, milestone.reached
```

---

## Implementation Phases

### Phase 1: Core Rebrand
- Rename app to BODY & MIND
- Update logo and branding
- Update navigation structure

### Phase 2: Daily Goal System
- Implement binary completion (Body ✓ + Mind ✓)
- Build combined streak logic
- Add streak urgency UI

### Phase 3: API Layer
- Build all REST endpoints
- Ensure everything is API-accessible
- Add authentication for external access

### Phase 4: Weight Configuration
- Implement presets
- Build slider interface
- Save user preferences

### Phase 5: Habit Stacking
- Stack creation UI
- Stack presets
- Cue/trigger system

### Phase 6: Whoop Enhancement
- Add Recovery/HRV sync
- Build recovery-aware recommendations
- Activity intensity suggestions

### Phase 7: Motivational System
- Build quotes database
- Implement rotation logic
- Add milestone celebrations

### Phase 8: AI Assistant Ready
- Document API for Claude integration
- Test all endpoints
- Build example Claude prompts

---

## Success Metrics

- Daily active completion rate (Body + Mind both done)
- Average streak length
- User retention at 7, 21, 66 days
- Whoop connection rate
- API usage (Claude interactions)

---

## Open Questions

1. Should incomplete activities roll over to next day?
2. Vacation/rest mode - pause streaks without losing?
3. Social features - share streaks with friends?

---

*This design document serves as the source of truth for the BODY & MIND app redesign.*
