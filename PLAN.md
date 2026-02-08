# PolyClone2 — Browser-Based Polytopia Clone

## Vision
A turn-based 4X strategy game playable in any modern browser, optimized for mobile touch controls. Inspired by Polytopia: simple enough to pick up quickly, deep enough to replay endlessly.

**Current scope: Single-player, client-side only, deployed to GitHub Pages.**

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | TypeScript (strict) | Type safety, tooling, team velocity |
| Rendering | PixiJS 8 | Fast 2D WebGL with canvas fallback, mobile perf |
| UI Overlays | Preact | Lightweight React-like for HUD/menus, ~3KB |
| State | Zustand | Minimal, works outside React, serializable |
| Build | Vite | Fast HMR, tree-shaking, small bundles |
| Testing | Vitest | Fast, TS-native, compatible with Vite |
| CI/CD | GitHub Actions | Lint + typecheck + test on push, deploy to Pages |
| Hosting | GitHub Pages | Free static hosting, sufficient for client-only |

---

## Core Game Mechanics (Polytopia Reference)

> Full mechanics reference: `docs/design/game-mechanics.md`

### Map
- Square grid (matches Polytopia)
- Procedural generation with biomes (forest, mountain, water, field)
- Fog of war — 3 states: unexplored, explored-not-visible, visible
- Map sizes: Tiny (11x11), Small (14x14), Normal (16x16), Large (18x18)

### Tribes / Factions (4 Starter Tribes)
> Full tribe data: `docs/design/tribes.md`

| Tribe | Color | Starting Tech | Starting Unit | Terrain Bias |
|-------|-------|---------------|---------------|--------------|
| Xin-Xi | Red | Climbing | Warrior | 1.5x mountains, 1.5x metal |
| Imperius | Blue | Organization | Warrior | 2.0x fruit, 0.5x animals |
| Bardur | Brown | Hunting | Warrior | 1.5x fruit, 0x crop |
| Oumaji | Yellow | Riding | Rider | 0.2x forest, 0.5x mountain |

Additional tribes deferred to future phases.

### Tech Tree
- 5 branches, 3 tiers (~24 technologies)
- Cost formula: `(Tier x Cities) + 4` — Literacy reduces by 33%
- Each tech unlocks: units, buildings, abilities, or terrain actions

### Combat
- Fully deterministic: `attackResult = round((attackForce/totalDamage) * ATK * 4.5)`
- Defense bonuses: Forest/Mountain/City 1.5x, City Wall 4.0x
- Retaliation uses DEF stat, calculated on pre-attack HP
- Veteran promotion at 3 kills: +5 max HP + full heal

### Resources & Economy
- **Stars**: Primary currency, 1 SPT per city level + capital bonus
- **Population**: Cities grow by harvesting resources (fruit, animals, fish, crops)
- City levels unlock bonuses (Workshop, Wall, Border Growth, Park/Giant)

### Units (10 Standard Types)
- Warrior, Archer, Defender, Rider, Swordsman, Mind Bender, Catapult, Knight, Cloak, Giant
- Naval: Raft, Scout, Rammer, Bomber (HP = carried unit's HP)
- Skills: Dash, Escape, Persist, Fortify, Stiff, Splash, Heal, Convert, Hide, etc.

### Cities
- Capture by moving unit onto enemy city
- Population tracks — harvest tiles to grow
- Level-up rewards: L2 Workshop/Explorer, L3 Wall/Stars, L4 Border/Pop, L5+ Park/Giant
- Borders: 3x3 at L1-3, 5x5 with Border Growth at L4+

### Turn Structure
1. Collect star income (automatic)
2. Action phase: move, attack, research, build, train — any order, freely interleaved
3. End turn (manual) → next player

### Win Conditions
- **Domination**: Last tribe standing (capture all cities)
- **Perfection**: Highest score after 30 turns

---

## Architecture

```
polyclone2/
├── src/
│   ├── core/              # Pure game logic (no rendering/browser deps)
│   │   ├── Game.ts        # Game state machine, action executor
│   │   ├── Map.ts         # Grid, tiles, fog of war
│   │   ├── Unit.ts        # Unit types, stats, actions
│   │   ├── City.ts        # City management, population
│   │   ├── Tech.ts        # Tech tree, research
│   │   ├── Combat.ts      # Deterministic combat resolver
│   │   ├── TurnManager.ts # Turn order, phase management
│   │   ├── Tribe.ts       # Faction definitions
│   │   ├── MapGen.ts      # Procedural map generation
│   │   └── Actions.ts     # All player actions as commands
│   ├── render/            # PixiJS rendering layer
│   │   ├── GameRenderer.ts    # Main render loop, camera
│   │   ├── TileRenderer.ts    # Tile sprites, terrain
│   │   ├── UnitRenderer.ts    # Unit sprites, animations
│   │   ├── CityRenderer.ts    # City visuals
│   │   ├── FogRenderer.ts     # Fog of war overlay
│   │   ├── Camera.ts          # Pan, zoom, touch gestures
│   │   └── AssetLoader.ts     # Sprite atlas loading
│   ├── ui/                # Preact UI components
│   │   ├── HUD.tsx        # Top bar (stars, turn, score)
│   │   ├── TechTree.tsx   # Tech tree modal
│   │   ├── UnitPanel.tsx  # Selected unit info + actions
│   │   ├── CityPanel.tsx  # City management panel
│   │   ├── MainMenu.tsx   # Title screen, game setup
│   │   └── GameOverScreen.tsx
│   ├── input/             # Input handling
│   │   ├── InputManager.ts    # Unified mouse/touch
│   │   └── Gestures.ts       # Pinch zoom, swipe, tap
│   ├── ai/                # Computer opponent (client-side)
│   │   ├── AIPlayer.ts       # AI decision loop
│   │   └── Evaluators.ts     # Tile/unit/city scoring
│   ├── store/             # Zustand stores
│   │   ├── gameStore.ts      # Current game state
│   │   └── uiStore.ts        # UI state (selected, modals)
│   ├── assets/            # Sprites, sounds, data
│   │   ├── sprites/
│   │   ├── data/          # JSON: units, techs, tribes
│   │   └── sounds/
│   ├── App.tsx            # Root component
│   └── main.ts           # Entry point
├── public/
│   └── index.html
├── docs/
│   └── design/            # Game design documents
│       ├── game-mechanics.md   # Combat, tech, economy, units, cities
│       ├── tribes.md           # 4 starter tribe definitions
│       ├── map-generation.md   # Procedural map gen rules
│       └── ui-ux.md            # UI layout, interactions, animations
├── tests/
│   ├── core/              # Unit tests for game logic
│   └── e2e/               # Browser tests (future)
├── .github/
│   └── workflows/
│       └── ci.yml         # CI + GitHub Pages deploy
├── AGENTS.md
├── PLAN.md
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

### Key Architectural Decisions

1. **Core logic is pure TypeScript with no rendering/browser dependencies.** This means:
   - Game logic is fully testable without a browser (runs under Vitest/Node)
   - Same logic can later run on a multiplayer server
   - AI runs headless using the same API

2. **Command pattern for all actions.** Every player action is a serializable command object:
   ```ts
   { type: 'MOVE_UNIT', unitId: 5, to: {x: 3, y: 7} }
   { type: 'RESEARCH_TECH', tech: 'sailing' }
   { type: 'TRAIN_UNIT', cityId: 2, unitType: 'rider' }
   ```
   This enables: undo/redo, replay, save/load, and future multiplayer sync.

3. **Rendering is a thin view layer.** The renderer reads game state and draws. It never mutates state. Animations are visual-only and don't block the game loop.

4. **Mobile-first input.** All interactions work with touch. Mouse/keyboard are progressive enhancements. Large tap targets, bottom-sheet panels, pinch-to-zoom.

5. **Client-side only (for now).** All game logic, AI, save/load runs in the browser. No server. This simplifies deployment (static GitHub Pages) and development. Server architecture will be added when multiplayer is introduced.

---

## Milestones & Tasks

### Phase 0: Foundation (Sprint 1-2)
**Goal:** Playable grid with units that can move.

| # | Task | Owner | Deps | Status |
|---|------|-------|------|--------|
| 0.1 | Project scaffolding (Vite + TS + PixiJS + Preact + Vitest) | @infra | — | |
| 0.2 | GitHub Actions CI (lint + typecheck + test) | @infra | 0.1 | |
| 0.3 | GitHub Pages deployment workflow | @infra | 0.1 | |
| 0.4 | Define data schemas: Tile, Unit, City, Tech (JSON) — 4 tribes only | @design | — | done |
| 0.5 | Implement grid model + tile types | @gamedev | 0.1 | |
| 0.6 | Render grid with PixiJS (placeholder art) | @gamedev | 0.5 | |
| 0.7 | Camera system (pan + zoom + touch pinch) | @gamedev | 0.6 | |
| 0.8 | Place units on grid, tap to select, tap to move | @gamedev | 0.6 | |
| 0.9 | Turn system (end turn cycles players) | @gamedev | 0.8 | |

**Deliverable:** A grid you can pan/zoom, with units you can select and move, turns you can end. Deployed to GitHub Pages.

---

### Phase 1: Core Gameplay (Sprint 3-5)
**Goal:** Full single-player game against AI.

| # | Task | Owner | Deps | Status |
|---|------|-------|------|--------|
| 1.1 | Procedural map generation (biomes, resources) | @gamedev | 0.5 | |
| 1.2 | Complete game design doc (all units, techs, costs) | @design | 0.4 | done |
| 1.3 | City system (capture, population, growth, borders) | @gamedev | 0.8, 1.2 | |
| 1.4 | Tech tree (research, unlock gating) | @gamedev | 1.2 | |
| 1.5 | Resource/economy system (stars, income) | @gamedev | 1.3 | |
| 1.6 | Combat system (attack, retaliation, HP, death) | @gamedev | 1.2 | |
| 1.7 | Standard unit types with abilities (10 land + 4 naval) | @gamedev | 1.6 | |
| 1.8 | Fog of war | @gamedev | 1.1 | |
| 1.9 | Tile improvements (farm, mine, sawmill, port, etc.) | @gamedev | 1.3 | |
| 1.10 | Basic AI opponent (expand, build, attack) | @gamedev | 1.7 | |
| 1.11 | UI: HUD, tech tree modal, unit panel, city panel | @gamedev | 1.4, 1.5 | |
| 1.12 | Balance pass #1 (unit stats, tech costs, income) | @design | 1.7 | |
| 1.13 | Save/load game state (localStorage) | @gamedev | 1.5 | |

**Deliverable:** Full single-player game: generate map, explore, expand, research, fight AI, win/lose.

---

### Phase 2: Polish & Mobile (Sprint 6-7)
**Goal:** Smooth mobile experience, real art, animations.

| # | Task | Owner | Deps | Status |
|---|------|-------|------|--------|
| 2.1 | Sprite art for all tiles, units, buildings | @design | 1.2 | |
| 2.2 | Replace placeholder art with sprites | @gamedev | 2.1 | |
| 2.3 | Unit animations (move, attack, death) | @gamedev | 2.2 | |
| 2.4 | Sound effects + ambient music | @design | — | |
| 2.5 | Mobile UI optimization (responsive, touch targets) | @gamedev | 1.11 | |
| 2.6 | PWA setup (offline play, install prompt) | @infra | 2.2 | |
| 2.7 | Performance profiling + bundle optimization | @infra | 2.3 | |
| 2.8 | Tribe selection (4 tribes) + cosmetic differentiation | @gamedev | 2.2 | |
| 2.9 | Tutorial / first-time experience | @design | 1.11 | |
| 2.10 | Score system + game-over screen | @gamedev | 1.5 | |
| 2.11 | Balance pass #2 | @design | 2.10 | |

**Deliverable:** Polished, mobile-playable single-player game with real art and smooth UX.

---

### Phase 3: Expansion (Future)
> Additional tribes (12 regular + 4 special), multiplayer infrastructure, server architecture. Deferred — will be planned when single-player with 4 tribes is solid.

---

## Mobile Optimization Strategy

1. **Viewport:** `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`
2. **Touch:** All interactions are tap/drag/pinch. No hover-dependent UI.
3. **UI Layout:** Bottom sheets for panels (thumb-reachable). Top bar for status.
4. **Performance targets:** 60fps on mid-range phones. Budget: <5ms game logic, <12ms render per frame.
5. **Asset budget:** <2MB initial load. Lazy-load sounds. Compressed sprite atlases.
6. **Orientation:** Landscape preferred, portrait supported with adjusted UI.
