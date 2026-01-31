# Phase 6 Implementation Plan: Authentication UI

**Status**: Complete
**Started**: 2025-01-31
**Priority**: P1 - MVP Critical

---

## Goal

User can sign up, log in, and stay authenticated. New users get onboarded with their 5 Habitanimals.

---

## Status Check

### Already Completed (from earlier phases):
- NextAuth.js configured with credentials provider ✅
- JWT generation/verification ✅
- Password hashing with bcrypt ✅
- POST /api/v1/auth/signup (creates user + 5 habitanimals) ✅
- T090: Auto-create habitanimals on signup ✅

### Remaining Tasks:
- T080: POST /api/v1/auth/logout
- T081: GET /api/v1/auth/me
- T082: PATCH /api/v1/auth/me
- T084: Login page UI
- T085: Signup page UI
- T086: Auth form components
- T087: Protected route wrapper
- T088: Session persistence (localStorage + context)
- T089: Onboarding flow for new users

---

## Execution Order

```
┌─────────────────────────────────────────────────┐
│  API Endpoints (T080-T082)                      │
│  • POST /auth/logout                            │
│  • GET /auth/me                                 │
│  • PATCH /auth/me                               │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│  Auth Infrastructure (T086-T088)                │
│  • AuthContext (session state)                  │
│  • Protected route wrapper                      │
│  • Form components                              │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│  Pages (T084-T085, T089)                        │
│  • Login page                                   │
│  • Signup page                                  │
│  • Onboarding flow                              │
└─────────────────────────────────────────────────┘
```

---

## Parallel Agent Assignment

### Agent 1: Auth API Endpoints
- T080: POST /api/v1/auth/logout
- T081: GET /api/v1/auth/me
- T082: PATCH /api/v1/auth/me
- POST /api/v1/auth/login (new, for direct API login)

### Agent 2: Auth Context & Protected Routes
- T086: Auth form components (AuthInput, AuthButton)
- T087: Protected route wrapper (ProtectedRoute component)
- T088: AuthContext with session persistence
- useAuth hook

### Agent 3: Auth Pages & Onboarding
- T084: Full Login page with form
- T085: Full Signup page with form
- T089: Onboarding flow (welcome screen, meet habitanimals)
