# PolyClone2 — Development Guide

## What is this?
A browser-based, mobile-compatible clone of Polytopia (turn-based 4X strategy game). Single-player, client-side only, deployed to GitHub Pages.

## Repo
- Remote: https://github.com/santolucito/Polyclone2
- Hosting: GitHub Pages (static, client-side only)

## Key Files
- `PLAN.md` — Full project plan, architecture, milestones, task breakdown
- `AGENTS.md` — Team roles and ownership areas
- `docs/design/game-mechanics.md` — Combat, tech tree, economy, units, cities, buildings
- `docs/design/tribes.md` — 4 starter tribes (Xin-Xi, Imperius, Bardur, Oumaji)
- `docs/design/map-generation.md` — Procedural map generation rules
- `docs/design/ui-ux.md` — UI layout, interactions, animations, mobile patterns
- `src/core/` — Pure game logic (no rendering deps, fully testable)
- `src/render/` — PixiJS rendering layer (read-only view of game state)
- `src/ui/` — Preact UI components (HUD, panels, menus)

## Architecture Rules
1. **Core logic must be pure.** `src/core/` has ZERO imports from PixiJS, Preact, or browser APIs. It must run in Node.js for testing (and future server use).
2. **Command pattern.** All player actions are serializable command objects processed through `Game.executeAction()`. Never mutate state directly from UI or renderer.
3. **Renderer never mutates game state.** It reads state and draws. Animations are visual-only.
4. **Mobile-first.** Every UI interaction must work with touch. No hover-dependent features.
5. **Client-side only.** No server dependencies. All game logic, AI, and save/load runs in the browser.

## Tech Stack
- TypeScript (strict mode) + Vite
- PixiJS 8 for rendering
- Preact for UI overlays
- Zustand for state management
- Vitest for testing
- GitHub Actions for CI/CD → GitHub Pages

## Code Style
- TypeScript strict mode, no `any` without justification
- Game data (units, techs, tribes) lives in JSON files under `src/assets/data/`
- Tests go in `tests/` mirroring `src/` structure
- Use `vitest` for unit tests

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm test` — Run tests
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint
