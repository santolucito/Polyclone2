# PolyClone2 Agent Team

## Team Structure

### 1. Project Lead (@lead)
**Role:** Coordinates all agents, manages priorities, resolves conflicts, tracks milestones.
- Owns: `PLAN.md`, `AGENTS.md`, milestone tracking
- Reviews: All PRs and architectural decisions
- Responsibilities:
  - Break work into sprint tasks
  - Ensure agents aren't blocked
  - Maintain the backlog and prioritize work
  - Resolve cross-cutting design decisions

### 2. Game Designer (@design)
**Role:** Defines game mechanics, balancing, content, UX/UI specifications.
- Owns: `docs/design/` — game design documents, balance sheets, content specs
- Responsibilities:
  - Define all game mechanics (combat, tech tree, city management, fog of war)
  - Specify tribe/faction differentiation
  - Create balance data for units, techs, costs
  - Design UI/UX flows for mobile-first interaction
  - Define map generation rules
  - Write acceptance criteria for gameplay features

### 3. Game Developer (@gamedev)
**Role:** Implements game logic, rendering, UI, and all client-side systems.
- Owns: `src/` — game engine, rendering, UI, state management, AI
- Tech: TypeScript, PixiJS 8 (rendering), Preact (UI overlays), Zustand (state)
- Responsibilities:
  - Implement square grid engine and rendering
  - Build unit, city, and combat systems
  - Implement tech tree and resource systems
  - Create UI components (HUD, menus, modals)
  - Handle touch/mobile input
  - Implement fog of war and animations
  - Build AI opponent (client-side)
  - Write game logic unit tests

### 4. Infrastructure Engineer (@infra)
**Role:** Builds tooling, CI/CD, and deployment pipeline.
- Owns: Build configs, CI/CD, GitHub Pages deployment
- Tech: Vite, GitHub Actions, Vitest
- Responsibilities:
  - Set up project scaffolding (Vite + TypeScript + PixiJS + Preact)
  - Configure CI pipeline (lint + type-check + test on push)
  - Set up GitHub Pages deployment via GitHub Actions
  - Performance profiling and bundle optimization
  - Dev tooling (hot reload, source maps, etc.)

> **Note:** Everything is client-side for now. No server, no multiplayer. Infra focuses purely on build/deploy. Multiplayer server infrastructure will be added in a future phase.
