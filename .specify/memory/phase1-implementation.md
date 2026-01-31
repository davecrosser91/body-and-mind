# Phase 1 Implementation Plan: Setup

**Status**: In Progress
**Started**: 2025-01-30

---

## Execution Order

```
T001 (Next.js Init) ← Must complete first
       ↓
┌──────┴──────┬──────────┬──────────┐
T002          T003       T004       T005
(ESLint)      (Prisma)   (Folders)  (Env)
└──────┬──────┴──────────┴──────────┘
       ↓
T006 (Dependencies) ← After project exists
```

---

## Task Details

### T001: Initialize Next.js 14 Project

**Command**:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Expected Result**:
- Next.js 14 with App Router
- TypeScript configured
- TailwindCSS installed
- src/ directory structure
- Basic ESLint config

---

### T002: Configure ESLint, Prettier, Strict TypeScript [P]

**Files to create/modify**:
- `.prettierrc` - Prettier config
- `.prettierignore` - Ignore patterns
- `tsconfig.json` - Enable strict mode
- `.eslintrc.json` - Enhanced rules

**Prettier Config**:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**TypeScript Strict**:
- `"strict": true`
- `"noUncheckedIndexedAccess": true`
- `"noImplicitReturns": true`

---

### T003: Setup Prisma with PostgreSQL [P]

**Commands**:
```bash
npm install prisma @prisma/client
npx prisma init
```

**Files**:
- `prisma/schema.prisma` - Basic schema with datasource
- Update `.env` with DATABASE_URL placeholder

---

### T004: Create Project Folder Structure [P]

**Structure to create**:
```
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
│       └── v1/
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── habitanimals/
│   └── habits/
├── lib/
└── types/

tests/
├── unit/
└── e2e/

public/
└── habitanimals/
```

---

### T005: Setup Environment Variables [P]

**Files**:
- `.env.example` - Template with all required vars
- `.env.local` - Local development (gitignored)
- Update `.gitignore` for env files

**Variables**:
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
```

---

### T006: Install Additional Dependencies

**Command**:
```bash
npm install next-auth @auth/prisma-adapter framer-motion zod next-swagger-doc swagger-ui-react
npm install -D vitest @testing-library/react @playwright/test prettier
```

---

## Parallel Execution Plan

1. **Sequential**: T001 (creates project)
2. **Parallel**: T002, T003, T004, T005 (independent setup tasks)
3. **Sequential**: T006 (needs package.json from T001)
