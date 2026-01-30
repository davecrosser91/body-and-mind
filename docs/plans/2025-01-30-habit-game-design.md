# Habit Game Design Document

> Gamified habit-tracking app with creature companions

**Created**: 2025-01-30
**Status**: Design Complete — Ready for Implementation Planning

---

## Vision

Eine cleane, moderne Wellness-App mit Fokus auf Daten und Fortschritt — aber mit emotionalen Creature-Companions als Kern. Weniger "Game", mehr "Premium Personal Growth Tool mit Charakter".

**Inspiriert von**: Atomic Habits (James Clear), Duolingo (Gamification), Pokemon (Creatures), Headspace (Ästhetik)

---

## Core Concept

### Avatar + Creature Companions

- **Du hast einen Avatar** (dich selbst)
- **5 Creature Companions** — jedes repräsentiert einen Lebensbereich
- Creatures SIND deine sichtbare Identität in diesem Bereich (Identity-Based Habits)
- Creatures reagieren auf den Habit Loop (Cue → Craving → Response → Reward)
- Habit Stacking = Creature Synergien (Combos wenn mehrere Habits nacheinander)

### Die 5 Starter-Creatures

| Creature | Bereich | Beispiel-Habits | Datenquelle |
|----------|---------|-----------------|-------------|
| Kraft-Creature | Fitness | Workout, Stretching, Schritte | Whoop (Strain) |
| Ruhe-Creature | Mindfulness | Meditation, Atemübungen, Journaling | Manuell |
| Nähr-Creature | Ernährung | Gesund essen, Wasser trinken | Manuell |
| Schlaf-Creature | Erholung | Schlafenszeit, Schlafdauer, Qualität | Whoop (Sleep, HRV, Recovery) |
| Wissens-Creature | Lernen | Lesen, Duolingo, Skill-Training | Manuell |

**Designprinzip**: Erweiterbar — neue Kategorien können später hinzugefügt werden.

---

## Atomic Habits Integration

### Habit Loop durch Creatures

| Phase | Implementation |
|-------|----------------|
| **Cue** | Creature signalisiert (optional: Push-Notification "vom" Creature) |
| **Craving** | User will Creature glücklich/gesund sehen |
| **Response** | User macht den Habit |
| **Reward** | Creature feiert, zeigt Zuneigung, gewinnt XP |

### Habit Stacking Combos

Wenn Habits nacheinander erledigt werden (z.B. Morgenroutine):
- Bonus-XP
- Spezielle Creature-Interaktionen
- Combo-Visualisierung

### "Never Miss Twice" System

Basierend auf Atomic Habits Philosophie — kein harter Streak-Reset:

| Situation | Creature Reaktion |
|-----------|-------------------|
| 1 Tag verpasst | Creature etwas müde, aber ok |
| 2 Tage hintereinander | Creature wird traurig, verliert Energie |
| Zurückkommen | Creature erholt sich, freut sich |

**Kein numerischer Streak-Zähler** — stattdessen sichtbare Creature Health als emotionales Feedback.

---

## Progression System

### Hybrid: Levels + Evolutionen

**Kontinuierliches Leveling:**
- Creature sammelt XP durch abgeschlossene Habits
- Level 1 → 100 (oder offen)
- Jedes Level = kleine Verbesserung

**Evolution-Milestones:**
- Bei bestimmten Leveln (z.B. 10, 25, 50) transformiert das Creature
- 3-4 Evolutionsstufen pro Creature
- Große emotionale "Wow"-Momente

```
Baby (Level 1-9) → Teen (Level 10-24) → Adult (Level 25-49) → Legendary (Level 50+)
```

---

## Habit Tracking

### Flexible Eingabe

- **Quick Check-in**: Tap "erledigt"
- **Manuelle Details**: "45 min Workout", "2L Wasser", "30 Seiten gelesen"
- **Automatisch via Whoop**: Schlaf, HRV, Recovery, Strain

### Whoop Integration (V1)

Automatisch synchronisierte Daten:
- Schlafdauer & Qualität
- HRV (Heart Rate Variability)
- Recovery Score
- Strain Score
- Ruhepuls

Diese Daten füttern direkt das Schlaf-Creature und Kraft-Creature.

---

## User Interface

### Visueller Stil

**Minimalistisch / Flat Design**
- Clean, modern, weniger verspielt
- Fokus auf Daten und Progress
- Ästhetik Richtung Headspace/Calm
- Creatures sind cute aber nicht überladen

### Dashboard-First

Beim App-Start sofort sichtbar:
- Heutige Habits (To-Do / Done)
- Creature-Status (Health, Level, nächste Evolution)
- Key Stats (Streak-Äquivalent via Creature Health)
- Whoop-Daten Übersicht

### Navigation

```
[Dashboard] - [Creatures] - [History/Stats] - [Settings]
```

---

## Notifications

### Creature-Nachrichten (Optional)

- **Default: Aus** — keine Notifications ohne Zustimmung
- **Wenn aktiviert**: Nachrichten kommen "von" deinem Creature
  - "Dein Ruhe-Creature vermisst dich 🧘"
  - "Dein Kraft-Creature ist bereit für ein Workout 💪"
- User kontrolliert komplett wann/welche Notifications

---

## Social Features

### V1: Keine

Bewusste Entscheidung: Kein Leaderboard, keine Leagues, kein sozialer Druck.

### V2+ (Später)

- Freunde hinzufügen
- Challenges (z.B. "7 Tage Meditation Streak Challenge")
- Profil-Vergleich (optional)

---

## Platform & Tech

### V1: Web-First

- Browser-basierte App
- Responsive Design (Mobile-friendly)
- Kein App Store nötig

### Tech Stack (Empfohlen)

```
Frontend:     React/Next.js oder SvelteKit
Backend:      Node.js oder Python (FastAPI)
Database:     PostgreSQL + Redis
Auth:         OAuth (Google, Apple)
API:          Whoop API Integration
Hosting:      Vercel / Railway / Supabase
```

### V2+: Mobile Apps

- iOS App (Apple Health Integration)
- Android App
- Flutter oder React Native für Cross-Platform

---

## MVP Scope (V1)

### Included

- [ ] Dashboard mit Habit-Übersicht
- [ ] 5 Creatures (eines pro Kategorie)
- [ ] Flexible Habit-Eingabe (Check-in + manuelle Daten)
- [ ] Whoop Integration (Schlaf, Recovery, Strain)
- [ ] Creature Health System (reagiert auf Habits)
- [ ] Basic Leveling (XP sammeln, Level steigen)
- [ ] Erste Evolution pro Creature (bei Level 10)
- [ ] Minimalistisches UI Design
- [ ] User Authentication

### Excluded from V1 (Later)

- Weitere Evolutionen (Level 25, 50)
- Habit Stacking Combos mit Bonus-XP
- Apple Health / Native Mobile App
- Freunde & Challenges
- Achievements / Badges
- Multiple Creatures pro Kategorie
- Detailed Analytics / Insights

---

## Open Questions

Noch zu klären vor/während Implementation:

1. **Creature Design**: Wer designt die Creatures? (AI-generated, Artist, Placeholder?)
2. **Naming**: App-Name? Creature-Namen?
3. **Onboarding**: Wie lernt der User das System kennen?
4. **Monetization**: Free? Freemium? Subscription? (für später)

---

## Next Steps

1. **Implementation Plan erstellen** — Tasks aufbrechen
2. **Tech Stack finalisieren** — Framework-Entscheidung
3. **Creature Designs** — Erste Visuals/Mockups
4. **Whoop API** — Developer Account, API Dokumentation prüfen
5. **Development starten** — MVP bauen

---

## Appendix: Research

Siehe `/research/` Ordner:
- `gamification-habits-mindfulness.md` — Duolingo, Pokemon, Atomic Habits, Mindfulness, Jay Shetty
- `spec-driven-frameworks.md` — Kiro, Spec-Kit, Flutter, Tech Stacks
