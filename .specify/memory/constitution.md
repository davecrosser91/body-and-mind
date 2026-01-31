# Routine Game Constitution

## Core Principles

### I. User-First Design
Every decision prioritizes User Experience over technical elegance. The app must feel intuitive, fast, and emotionally engaging. If a technically "correct" solution hurts UX, we choose the user-friendly alternative.

### II. Atomic Habits Aligned
All features must support James Clear's 4 Laws of Behavior Change:
- **Make it Obvious** — Clear cues, visible progress, dashboard-first
- **Make it Attractive** — Habitanimal companions, evolution rewards, visual feedback
- **Make it Easy** — Minimal friction, quick check-ins, smart defaults
- **Make it Satisfying** — Immediate rewards, habitanimal reactions, XP gains

The "Never Miss Twice" philosophy replaces punitive streak systems.

### III. YAGNI (You Aren't Gonna Need It)
Build only what's necessary for MVP. No speculative features, no "nice-to-haves", no premature optimization. Every feature must justify its existence against the MVP scope.

### IV. Test-Driven for Critical Paths
Critical flows require tests before implementation:
- Habit tracking & completion logic
- XP calculation & leveling
- Habitanimal health state machine
- Whoop API integration
- User authentication

Non-critical UI can be tested manually.

### V. Extensibility by Design
Architecture must allow additions without rewrites:
- New Habitanimal types without core changes
- New Habit categories without schema migrations
- New integrations (Apple Health, Strava) without API redesign
- New evolution stages without progression system changes

## Tech Standards

### Frontend
- Minimalist, flat design aesthetic
- Mobile-responsive web-first
- Fast load times (<3s initial, <1s interactions)
- Accessible (WCAG 2.1 AA minimum)

### Backend
- RESTful API design
- Stateless where possible
- Clear separation: Auth, Habits, Habitanimals, Integrations
- Whoop API as primary external dependency for V1

### Data
- User owns their data
- Privacy-first (minimal data collection)
- Secure credential storage for integrations

## Development Workflow

### Branching
- `main` — production-ready code
- `develop` — integration branch
- `feature/*` — individual features
- `fix/*` — bug fixes

### Code Quality
- Code review required for main/develop merges
- Linting enforced
- TypeScript strict mode (if using TS)

### Documentation
- README updated with setup instructions
- API endpoints documented
- Habitanimal/Habit system documented for future contributors

## Governance

This constitution guides all development decisions. When in doubt:
1. Check if it serves the user (Principle I)
2. Check if it aligns with Atomic Habits (Principle II)
3. Check if it's truly needed for MVP (Principle III)

Amendments require documented reasoning and updating this file.

**Version**: 1.0.0 | **Ratified**: 2025-01-30 | **Last Amended**: 2025-01-30
