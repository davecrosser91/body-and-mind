# Spec-Driven Frameworks Research

> Research compiled for building a gamified habit-tracking game

---

## What is Spec-Driven Development (SDD)?

Spec-driven development is a methodology where **formal, detailed specifications serve as executable blueprints** for AI code generation. Instead of "vibe coding" (writing code first and hoping AI fills the gaps), you define *what* the system should do before writing *how*.

**Core principle**: The specification becomes the source of truth for both humans and AI agents.

**Traditional vs. SDD workflow**:

| Traditional | Spec-Driven |
|-------------|-------------|
| Requirements → Design → Manual Coding → Testing | Requirements → **Detailed Specification** → AI Generation → Validation |

---

## Major Spec-Driven Frameworks

### 1. Kiro (AWS-backed)

**Website**: [kiro.dev](https://kiro.dev/)

**What it is**: An agentic IDE built on VS Code that turns prompts into clear requirements, structured designs, and implementation tasks.

**Key Features**:
- **Specs** - Plan and build features using structured specifications
- **Hooks** - Automate repetitive tasks with intelligent triggers
- **Agentic Chat** - Build features through natural conversation
- **Steering** - Guide behavior with custom rules via markdown files
- **MCP Servers** - Connect external tools through Model Context Protocol

**The 3-Phase Workflow**:

1. **Requirements**: Natural language → User stories + acceptance criteria (EARS notation)
2. **Design**: Analyzes codebase → Architecture, system design, tech stack
3. **Implementation**: Creates task list with dependencies + optional tests

**Pros**:
- Great for greenfield projects and mid-to-large features
- Specs stay synced with evolving codebase
- Works with any tech stack (not AWS-specific)
- Free tier available, no AWS account required

**Cons**:
- Overkill for small features or bug fixes
- Non-visual specs less helpful for UI-heavy work
- Still maturing

**Getting Started**:
1. Download from [kiro.dev](https://kiro.dev/)
2. Sign in with GitHub, Google, AWS Builder ID, or IAM Identity Center
3. Open folder → Select "Spec" mode → Start building

---

### 2. GitHub Spec-Kit

**Repository**: [github.com/github/spec-kit](https://github.com/github/spec-kit)

**What it is**: Open-source toolkit implementing spec-driven development workflow, works with 15+ AI coding agents.

**Key Features**:
- Constitutional guidance (project principles)
- Specification creation (requirements/user stories)
- Technical planning (architecture + tech stack)
- Task breakdown (actionable checklists)
- Automated implementation

**Supported AI Agents**: Claude Code, GitHub Copilot, Cursor, Google Gemini, IBM Bob, and more.

**Installation**:
```bash
# Persistent installation (recommended)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# Initialize project
specify init <PROJECT_NAME>
specify init . --ai claude
```

**Workflow Commands**:
| Command | Purpose |
|---------|---------|
| `/speckit.constitution` | Define governing principles |
| `/speckit.specify` | Describe requirements |
| `/speckit.plan` | Outline technical architecture |
| `/speckit.tasks` | Generate implementation checklist |
| `/speckit.implement` | Build the feature |

**Pros**:
- Open source
- Works with your preferred AI agent
- Well-documented workflow

**Cons**:
- Experimental (v0.0.30+)
- Better for new projects than existing codebases
- Requires Python 3.11+

---

### 3. Tessl

**What it is**: Specification-centric framework with continuous code regeneration.

**Key Features**:
- Can reverse-engineer specs from existing code
- Continuous regeneration philosophy

**Status**: More future-focused; CLI available for spec extraction from existing projects.

---

### 4. SpecPulse

**Repository**: [github.com/specpulse/specpulse](https://github.com/specpulse/specpulse)

**What it is**: SDD framework with API-first development support.

**Key Features**:
- Design API first
- Generate OpenAPI specifications
- Create implementation plans
- Implement based on spec

**Best for**: API-heavy applications where OpenAPI/Swagger specs are central.

---

### 5. Other Tools with SDD Principles

| Tool | SDD Feature |
|------|-------------|
| **Cursor Plan Mode** | Auto-generates plan before code changes |
| **Claude Code** | 200k context window, understands spec-to-implementation relationships |
| **Gemini CLI** | Planning phases with MCP extensions |
| **OpenAI Codex 2025** | Structured engineering tasks |
| **Cline/Genkit** | Open-source, execute structured plans |

---

## Mobile/App Development Frameworks

For building a gamified habit app, you'll also need to choose an implementation framework:

### Flutter (Recommended for Gamified Apps)

**Why Flutter for habit games**:
- **Superior animations** - Skia 2D rendering engine for smooth, pixel-perfect visuals
- **Consistent UI** - Identical behavior across platforms
- **Performance** - Compiles directly to native ARM code
- **Hot reload** - Instant preview of changes
- **Market share** - 46% of mobile developers use Flutter (170k GitHub stars)

**Used by**: Alibaba, Google Ads, Reflectly, Tencent

**Language**: Dart

---

### React Native

**Why React Native**:
- **JavaScript ecosystem** - Leverage existing web skills
- **Mature ecosystem** - Extensive third-party libraries
- **Native feel** - Uses actual native UI components
- **Market share** - 35% of developers (121k GitHub stars)

**Used by**: Facebook, Instagram, Shopify

**Language**: JavaScript/TypeScript

**Consideration**: Can face performance limitations in graphics-heavy apps.

---

### Comparison for Gamified Habit Apps

| Aspect | Flutter | React Native |
|--------|---------|--------------|
| **Animations** | Excellent (Skia engine) | Good (native bridges) |
| **Performance** | Near-native | Good, occasional native code needed |
| **Learning curve** | Learn Dart | Use existing JS knowledge |
| **Gamification UIs** | Superior | Good |
| **Community** | Growing fast | Mature |
| **Best for** | Design-centric apps | JS-experienced teams |

**Verdict**: For a gamified habit app with smooth animations, character progression, and game-like interactions, **Flutter** is likely the better choice due to its rendering capabilities.

---

## Tech Stack Recommendations for Habit Game

### Option A: Full Spec-Driven with Kiro + Flutter

```
Specification Layer:  Kiro (spec-driven planning)
Frontend:             Flutter (cross-platform mobile)
Backend:              Node.js or Python (FastAPI)
Database:             PostgreSQL + Redis (caching)
AI/ML:                TensorFlow Lite (personalization)
Cloud:                AWS/Firebase
```

### Option B: GitHub Spec-Kit + React Native

```
Specification Layer:  GitHub Spec-Kit + Claude Code
Frontend:             React Native
Backend:              Node.js (Express/NestJS)
Database:             MongoDB or Supabase
Cloud:                Vercel + Supabase
```

### Option C: Rapid MVP (No-Code + Spec)

```
Specification:        Kiro or manual markdown specs
Frontend:             FlutterFlow (no-code Flutter)
Backend:              Supabase (auth + database)
```

---

## Development Cost Estimates

| Type | Cost Range |
|------|------------|
| Single platform (iOS or Android) | $15,000 - $40,000 |
| Cross-platform (Flutter/RN) | $30,000 - $80,000 |
| AI-powered MVP | $30,000 - $60,000 |
| Mid-level with AI | $80,000 - $120,000 |
| Enterprise-grade | $200,000+ |

*Note: With SDD + AI assistance, development costs can be significantly reduced.*

---

## Recommendation for Your Habit Game

**Best combo**: **Kiro + Flutter**

**Rationale**:
1. **Kiro** handles the complexity of planning a gamified system (user stories, game mechanics, progression systems)
2. **Flutter** excels at the smooth animations and game-like UI your habit game needs
3. Both are free/low-cost to start
4. Kiro's spec approach ensures your Atomic Habits concepts (cue → craving → response → reward) are properly architected before coding

**Alternative**: If you prefer working in this terminal with Claude Code, use **GitHub Spec-Kit** with Claude as your AI agent, then implement with Flutter.

---

## Sources

### Spec-Driven Development
- [Martin Fowler: Understanding Spec-Driven Development](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [GitHub Spec-Kit Repository](https://github.com/github/spec-kit)
- [Kiro Documentation](https://kiro.dev/docs/specs/)
- [Kiro: Introducing Kiro](https://kiro.dev/blog/introducing-kiro/)
- [SoftwareSeni: Spec-Driven Development in 2025](https://www.softwareseni.com/spec-driven-development-in-2025-the-complete-guide-to-using-ai-to-write-production-code/)
- [Scalable Path: Practical Guide to SDD](https://www.scalablepath.com/machine-learning/spec-driven-development-guide)
- [DEV Community: Getting Started with Kiro](https://dev.to/aws-heroes/getting-started-with-spec-driven-development-using-kiro-400l)
- [The New Stack: AWS Kiro Testing](https://thenewstack.io/aws-kiro-testing-an-ai-ide-with-a-spec-driven-approach/)

### Mobile Frameworks
- [Flutter vs React Native 2025 Comparison](https://www.thedroidsonroids.com/blog/flutter-vs-react-native-comparison)
- [Best Mobile App Development Frameworks 2025](https://www.xmethod.de/en/blog/best-app-development-frameworks)
- [Emizentech: Habit Tracking App Guide](https://emizentech.com/blog/habit-tracking-app.html)
- [Biz4Group: AI Habit Tracker Development](https://www.biz4group.com/blog/ai-habit-tracker-app-development)
