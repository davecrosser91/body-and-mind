# Phase 7 Implementation Plan: Whoop Integration

**Status**: Complete
**Started**: 2025-01-31
**Priority**: P2

---

## Goal

User can connect their Whoop account to automatically sync sleep and workout data, earning XP for their Habitanimals.

---

## Prerequisites

- T100: User must register a Whoop developer app at https://developer.whoop.com
- Environment variables needed:
  - `WHOOP_CLIENT_ID`
  - `WHOOP_CLIENT_SECRET`
  - `WHOOP_REDIRECT_URI` (e.g., `http://localhost:3000/api/v1/integrations/whoop/callback`)

---

## Execution Order

```
┌─────────────────────────────────────────────────┐
│  OAuth Flow (T101-T104)                         │
│  • POST /integrations/whoop/connect             │
│  • GET /integrations/whoop/callback             │
│  • DELETE /integrations/whoop                   │
│  • Token storage                                │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│  Data Sync (T105-T109)                          │
│  • Whoop API client                             │
│  • Sleep data fetch                             │
│  • Workout data fetch                           │
│  • Manual sync endpoint                         │
│  • XP mapping logic                             │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│  Settings UI (T110-T113)                        │
│  • Settings page                                │
│  • Whoop connect button                         │
│  • Connection status                            │
│  • Sync button                                  │
└─────────────────────────────────────────────────┘
```

---

## Parallel Agent Assignment

### Agent 1: Whoop OAuth & API Client
- T101-T104: OAuth flow endpoints
- T105: Whoop API client library

### Agent 2: Data Sync & XP Mapping
- T106-T107: Sleep and workout data fetch
- T108: Manual sync endpoint
- T109: XP mapping logic

### Agent 3: Settings UI
- T110: Settings page
- T111-T113: Whoop integration UI
