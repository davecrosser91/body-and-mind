# Phase 5 Implementation Plan: Habitanimal Health System UI

**Status**: Complete
**Started**: 2025-01-31
**Priority**: P1 - MVP Critical

---

## Goal

User can see Habitanimal health status, history, and receive visual feedback on health changes.

---

## Status Check

### Already Completed (from earlier phases):
- T071: Health decay logic ✅ (`src/lib/habitanimal-health.ts`)
- T072: Health recovery on completion ✅ (`src/lib/services/habit-completion.ts`)
- T073: Tests ✅ (28 tests in `tests/unit/habitanimal-health.test.ts`)
- T074: Health history in GET /api/v1/habitanimals/:id ✅
- T076: Health bar in HabitanimalCard ✅
- T077: Mood determination based on health ✅

### Remaining Tasks:
- T070: Daily health update job/trigger
- T075: GET /api/v1/habitanimals/:id/history endpoint
- T078: Health change animations (recovery sparkle, decay warning)
- T079: Full Habitanimal detail page

---

## Execution Order

```
┌─────────────────────────────────────────────────┐
│  API & Backend (T070, T075)                     │
│  • Daily health recalculation trigger           │
│  • History API endpoint                         │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│  UI Components (T078, T079)                     │
│  • Health change animations                     │
│  • Full detail page with charts                 │
└─────────────────────────────────────────────────┘
```

---

## Parallel Agent Assignment

### Agent 1: Backend (T070, T075)
- T070: Create API route to recalculate health on demand
- T075: Create dedicated history endpoint with XP and health over time

### Agent 2: UI Components (T078, T079)
- T078: HealthChangeAnimation component (sparkle/warning effects)
- T079: Full HabitanimalDetailPage with:
  - Large habitanimal display with mood
  - Health history chart
  - XP progress visualization
  - Related habits list
  - Evolution progress
