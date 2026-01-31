# Habit Animals 🦍🐢🐂🦥🦊

A gamified habit-tracking web app with Habitanimal companions that grow as you build better habits.

## Features

- **5 Habitanimals** - Each representing a life area:
  - 🦍 **Guiro** (Gorilla) - Fitness
  - 🐢 **Zen** (Turtle) - Mindfulness
  - 🐂 **Greeny** (Ox) - Nutrition
  - 🦥 **Milo** (Sloth) - Sleep
  - 🦊 **Finn** (Fox) - Learning

- **Atomic Habits Integration** - Based on James Clear's principles
- **"Never Miss Twice"** - Forgiving health system instead of punitive streaks
- **Level & Evolution System** - Habitanimals evolve at levels 10, 25, 50
- **Whoop Integration** - Auto-sync sleep and workout data (planned)

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS 4, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: NextAuth.js with JWT
- **Testing**: Vitest, Playwright

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

# Seed development data
npx prisma db seed

# Start development server
npm run dev
```

## API Documentation

Swagger UI available at `/docs` when running the dev server.

## Project Status

- ✅ Phase 1: Setup (Next.js, Prisma, TailwindCSS)
- ✅ Phase 2: Foundation (Auth, API Infrastructure, Core Logic)
- ✅ Phase 3: Dashboard (Habitanimal Display, Habit List)
- ✅ Phase 4: Habit Check-in (CRUD, Completion, Level-up)
- ✅ Phase 5: Health System UI (Detail Page, Animations, History)
- ✅ Phase 6: Auth UI (Login, Signup, Onboarding, Protected Routes)
- 🔲 Phase 7: Whoop Integration
- 🔲 Phase 8: Polish & Deploy

## License

MIT
