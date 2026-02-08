import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../../src/core/GameState.js';
import { GameMap } from '../../src/core/GameMap.js';
import { createCity } from '../../src/core/City.js';
import { createUnit, resetUnitIdCounter } from '../../src/core/UnitFactory.js';
import { TileType, UnitType } from '../../src/core/types.js';
import { executeAITurn } from '../../src/core/AI.js';
import type { GameConfig } from '../../src/core/types.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: GameConfig = {
  mapSize: 8,
  waterLevel: 0,
  tribes: ['xinxi', 'imperius'],
  difficulty: 'normal',
  winCondition: 'domination',
  turnLimit: null,
};

function makeState(config: GameConfig = DEFAULT_CONFIG): GameState {
  const map = GameMap.create(8, 8, TileType.Field);
  return new GameState(map, config);
}

/**
 * Advance to player 1's turn. Player 1 (imperius) starts with 5 stars
 * and receives income on endTurn (AI normal bonus = +2).
 */
function advanceToPlayer1(state: GameState): void {
  state.endTurn();
  expect(state.getCurrentPlayer()).toBe(1);
}

beforeEach(() => {
  resetUnitIdCounter();
});

// ---------------------------------------------------------------------------
// Phase 1: Research
// ---------------------------------------------------------------------------

describe('AI — research', () => {
  it('researches the cheapest available tech when it has stars', () => {
    const state = makeState();

    // Give AI player (1 = imperius) a city so tech costs are well-defined
    const city = createCity('imperius', { x: 6, y: 6 }, 'Imperius Capital', true);
    state.addCity(city);

    advanceToPlayer1(state);

    // Imperius starts with 'organization' researched.
    // Available tier-1 techs: climbing, hunting, riding, fishing (cost = 1*1+4 = 5 each)
    // Available tier-2 from organization: farming, strategy (cost = 2*1+4 = 6 each)
    // AI starts with 5 + income. Income = city level 1 + capital bonus 1 + AI normal bonus 2 = 4.
    // So AI has 5 + 4 = 9 stars.
    const starsBefore = state.getStars(1);
    expect(starsBefore).toBe(9);

    const techBefore = state.getTechState(1).getResearchedCount();

    executeAITurn(state);

    const techAfter = state.getTechState(1).getResearchedCount();
    expect(techAfter).toBeGreaterThan(techBefore);
  });
});

// ---------------------------------------------------------------------------
// Phase 2: Train
// ---------------------------------------------------------------------------

describe('AI — train', () => {
  it('trains units at its cities', () => {
    const state = makeState();

    // Give AI a city at (6, 6)
    const city = createCity('imperius', { x: 6, y: 6 }, 'Imperius Capital', true);
    state.addCity(city);

    advanceToPlayer1(state);

    // AI has 9 stars (5 starting + 4 income), which is enough for a warrior (cost 2)
    expect(state.getUnitAt(6, 6)).toBeUndefined();

    executeAITurn(state);

    // AI should have trained a unit at its city
    const unit = state.getUnitAt(6, 6);
    expect(unit).toBeDefined();
    expect(unit!.owner).toBe(1);
  });

  it('does not train when city tile is occupied', () => {
    const state = makeState();

    const city = createCity('imperius', { x: 6, y: 6 }, 'Imperius Capital', true);
    state.addCity(city);

    // Place an existing unit on the city tile
    const blocker = createUnit(UnitType.Warrior, 1, 6, 6);
    state.addUnit(blocker);

    advanceToPlayer1(state);

    const unitsBefore = state.getUnitsForPlayer(1).length;

    executeAITurn(state);

    // The warrior at (6,6) may have moved, so we just check no extra unit was trained
    // on the same tile while it was occupied. The AI moves first then might train.
    // Actually: AI trains BEFORE moving. So the blocker should prevent training.
    // After moving, the unit count should still be 1 (the original warrior, possibly moved).
    const unitsAfter = state.getUnitsForPlayer(1).length;
    // The AI should not have trained a second unit since the tile was occupied during training phase
    expect(unitsAfter).toBe(unitsBefore);
  });
});

// ---------------------------------------------------------------------------
// Phase 3: Move
// ---------------------------------------------------------------------------

describe('AI — move', () => {
  it('moves units toward enemies', () => {
    const state = makeState();

    // Place an enemy unit for player 0 on the far side
    const enemy = createUnit(UnitType.Warrior, 0, 0, 0);
    state.addUnit(enemy);

    // Place AI unit far from the enemy
    const aiUnit = createUnit(UnitType.Warrior, 1, 7, 7);
    state.addUnit(aiUnit);

    advanceToPlayer1(state);

    const distBefore =
      Math.abs(aiUnit.x - enemy.x) + Math.abs(aiUnit.y - enemy.y);

    executeAITurn(state);

    // Re-read the AI unit after the turn
    const moved = state.getUnit(aiUnit.id)!;
    expect(moved).toBeDefined();
    const distAfter =
      Math.abs(moved.x - enemy.x) + Math.abs(moved.y - enemy.y);

    expect(distAfter).toBeLessThan(distBefore);
    expect(moved.hasMoved).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Phase 4: Attack
// ---------------------------------------------------------------------------

describe('AI — attack', () => {
  it('attacks adjacent enemies', () => {
    const state = makeState();

    // Place enemy adjacent to where AI unit will be
    const enemy = createUnit(UnitType.Warrior, 0, 3, 3);
    state.addUnit(enemy);

    // Place AI unit adjacent to enemy
    const aiUnit = createUnit(UnitType.Warrior, 1, 4, 3);
    state.addUnit(aiUnit);

    advanceToPlayer1(state);

    const enemyHpBefore = state.getUnit(enemy.id)!.currentHp;

    executeAITurn(state);

    // Enemy should have taken damage (or been killed)
    const enemyAfter = state.getUnit(enemy.id);
    if (enemyAfter) {
      expect(enemyAfter.currentHp).toBeLessThan(enemyHpBefore);
    } else {
      // Enemy was killed — that's valid too
      expect(enemyAfter).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('AI — edge cases', () => {
  it('does nothing with no units or cities (no crash)', () => {
    const state = makeState();

    advanceToPlayer1(state);

    // AI player has no units and no cities — should not throw
    expect(() => executeAITurn(state)).not.toThrow();
  });

  it('handles AI turn when there are no enemies to move toward', () => {
    const state = makeState();

    const city = createCity('imperius', { x: 6, y: 6 }, 'Imperius Capital', true);
    state.addCity(city);

    const aiUnit = createUnit(UnitType.Warrior, 1, 5, 5);
    state.addUnit(aiUnit);

    advanceToPlayer1(state);

    // No enemy units exist — AI should not crash
    expect(() => executeAITurn(state)).not.toThrow();
  });
});
