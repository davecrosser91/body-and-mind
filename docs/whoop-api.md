# Whoop API Documentation

This document describes the Whoop API and how Habit Animals integrates with it.

## Overview

The Whoop API provides access to physiological data from Whoop wearable devices. Habit Animals uses this data to automatically award XP to Habitanimals based on real-world activities.

## Authentication

Whoop uses OAuth 2.0 for authentication.

### Endpoints

| Purpose | URL |
|---------|-----|
| Authorization | `https://api.prod.whoop.com/oauth/oauth2/auth` |
| Token Exchange | `https://api.prod.whoop.com/oauth/oauth2/token` |
| API Base | `https://api.prod.whoop.com/developer/v1` |

### OAuth Flow

1. User clicks "Connect Whoop" in Settings
2. Redirect to Whoop authorization URL with scopes
3. User authorizes the app
4. Whoop redirects back with authorization code
5. Exchange code for access token and refresh token
6. Store tokens in database (encrypted)

### Scopes

| Scope | Description |
|-------|-------------|
| `read:recovery` | Access recovery data (HRV, resting HR) |
| `read:sleep` | Access sleep data (duration, quality) |
| `read:workout` | Access workout data (strain, activities) |
| `read:cycles` | Access physiological cycle data |
| `read:profile` | Access user profile information |
| `offline` | Required to receive refresh tokens |

### Token Refresh

- Access tokens expire (check `expires_in` in response)
- Use refresh token to get new access token
- Existing tokens are invalidated when refreshed
- Recommendation: Use background job to refresh proactively

## Data Models

### Cycle

A Cycle represents a physiological rhythm (not calendar days). All other data (sleep, recovery, workouts) are associated with cycles.

```typescript
interface Cycle {
  id: number;              // Unique cycle ID
  user_id: number;         // Whoop user ID
  created_at: string;      // ISO date-time
  updated_at: string;      // ISO date-time
  start: string;           // Cycle start time
  end?: string;            // Cycle end time (absent if ongoing)
  timezone_offset: string; // TZD format (±hh:mm or Z)
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';
  score?: {
    strain: number;           // Day strain (0-21 scale)
    kilojoule: number;        // Energy expended
    average_heart_rate: number;
    max_heart_rate: number;
  };
}
```

### Recovery

Recovery data represents how recovered the user is after sleep.

```typescript
interface Recovery {
  cycle_id: number;        // Associated cycle
  sleep_id: number;        // Associated sleep
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';
  score?: {
    user_calibrating: boolean;
    recovery_score: number;      // 0-100 percentage
    resting_heart_rate: number;  // BPM
    hrv_rmssd_milli: number;     // HRV in milliseconds
    spo2_percentage?: number;    // Blood oxygen (if available)
    skin_temp_celsius?: number;  // Skin temperature
  };
}
```

### Sleep

Sleep data contains detailed sleep metrics.

```typescript
interface Sleep {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;           // Sleep start time
  end: string;             // Sleep end time
  timezone_offset: string;
  nap: boolean;            // True if this is a nap
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';
  score?: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number;
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  };
}
```

### Workout

Workout data contains exercise session information.

```typescript
interface Workout {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;           // Workout start time
  end: string;             // Workout end time
  timezone_offset: string;
  sport_id: number;        // Activity type ID
  sport_name: string;      // e.g., "Running", "Cycling"
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';
  score?: {
    strain: number;              // Workout strain (0-21)
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter?: number;
    altitude_gain_meter?: number;
    altitude_change_meter?: number;
    zone_duration: {
      zone_zero_milli: number;
      zone_one_milli: number;
      zone_two_milli: number;
      zone_three_milli: number;
      zone_four_milli: number;
      zone_five_milli: number;
    };
  };
}
```

## API Endpoints

### User Profile

```
GET /developer/v1/user/profile/basic
```

Returns basic user information.

### Cycles

```
GET /developer/v1/cycle
```

Returns paginated list of cycles. Query parameters:
- `start` - Start date filter
- `end` - End date filter
- `limit` - Results per page (default 10, max 25)
- `nextToken` - Pagination token

### Recovery

```
GET /developer/v1/recovery
```

Returns paginated list of recovery records.

### Sleep

```
GET /developer/v1/activity/sleep
```

Returns paginated list of sleep records.

### Workouts

```
GET /developer/v1/activity/workout
```

Returns paginated list of workouts.

## Habit Animals Integration

### XP Calculation

Whoop data is used to award XP to different Habitanimals:

| Habitanimal | Type | Whoop Data Used | XP Formula |
|-------------|------|-----------------|------------|
| Guiro | FITNESS | Workouts, Strain | `strain * 5` XP per workout |
| Zen | MINDFULNESS | Recovery Score | `recovery_score / 10` XP daily |
| Greeny | NUTRITION | (Manual only) | N/A |
| Milo | SLEEP | Sleep Performance | `sleep_performance / 10` XP daily |
| Finn | LEARNING | (Manual only) | N/A |

### Sync Process

1. Background job runs daily (or on-demand from Settings)
2. Fetch latest cycle, recovery, sleep, and workout data
3. Calculate XP based on formulas above
4. Award XP to appropriate Habitanimals
5. Log sync result in `WhoopSync` table

### Implementation Files

```
src/lib/whoop.ts           - OAuth client and API methods
src/lib/whoop-sync.ts      - Data sync and XP calculation
src/app/api/v1/integrations/whoop/
  ├── connect/route.ts     - Initiate OAuth flow
  ├── callback/route.ts    - Handle OAuth callback
  ├── disconnect/route.ts  - Remove integration
  └── sync/route.ts        - Trigger manual sync
```

## Rate Limiting

The Whoop API has rate limits (specific numbers not published). Best practices:
- Cache responses where appropriate
- Use pagination tokens instead of offset
- Implement exponential backoff on 429 errors
- Sync data in batches during off-peak hours

## Important Notes

1. **V1 Webhooks Removed**: Whoop has removed v1 webhooks. Use polling instead.
2. **Score States**: Always check `score_state` before accessing `score` object.
3. **Timezone Handling**: All times are UTC with timezone offset provided.
4. **Physiological Cycles**: Cycles don't align with calendar days - they're based on sleep patterns.
