import { describe, it, expect, beforeEach } from 'vitest';
import { GameMap } from '@core/GameMap';
import { GameState } from '@core/GameState';
import { createUnit, resetUnitIdCounter } from '@core/UnitFactory';
import { TileType, UnitType } from '@core/types';
import type { GameConfig } from '@core/types';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: GameConfig = {
  mapSize: 8,
  waterLevel: 0.3,
  tribes: ['xinxi', 'imperius'],
  difficulty: 'normal',
  winCondition: 'domination',
  turnLimit: null,
};

function makeState(width = 8, height = 8, config = DEFAULT_CONFIG): GameState {
  const map = GameMap.create(width, height, TileType.Field);
  return new GameState(map, config);
}

beforeEach(() => {
  resetUnitIdCounter();
});

// ---------------------------------------------------------------------------
// Unit CRUD
// ---------------------------------------------------------------------------

describe('GameState — addUnit / getUnit / getUnitAt', () => {
  it('adds a unit and retrieves it by ID', () => {
    const state = makeState();
    const unit = createUnit(UnitType.Warrior, 0, 3, 4);
    expect(state.addUnit(unit)).toBe(true);
    expect(state.getUnit(unit.id)).toEqual(unit);
  });

  it('retrieves a unit by grid position', () => {
    const state = makeState();
    const unit = createUnit(UnitType.Warrior, 0, 2, 5);
    state.addUnit(unit);
    expect(state.getUnitAt(2, 5)).toEqual(unit);
  });

  it('returns undefined for an empty tile', () => {
    const state = makeState();
    expect(state.getUnitAt(0, 0)).toBeUndefined();
  });

  it('prevents adding a unit on an occupied tile', () => {
    const state = makeState();
    const u1 = createUnit(UnitType.Warrior, 0, 3, 3);
    const u2 = createUnit(UnitType.Warrior, 1, 3, 3);
    expect(state.addUnit(u1)).toBe(true);
    expect(state.addUnit(u2)).toBe(false);
  });
});

describe('GameState — removeUnit', () => {
  it('removes an existing unit', () => {
    const state = makeState();
    const unit = createUnit(UnitType.Warrior, 0, 1, 1);
    state.addUnit(unit);
    expect(state.removeUnit(unit.id)).toBe(true);
    expect(state.getUnit(unit.id)).toBeUndefined();
    expect(state.getUnitAt(1, 1)).toBeUndefined();
  });

  it('returns false for a non-existent unit', () => {
    const state = makeState();
    expect(state.removeUnit('unit-999')).toBe(false);
  });
});

describe('GameState — getUnitsForPlayer', () => {
  it('returns only units belonging to the specified player', () => {
    const state = makeState();
    state.addUnit(createUnit(UnitType.Warrior, 0, 0, 0));
    state.addUnit(createUnit(UnitType.Warrior, 0, 1, 0));
    state.addUnit(createUnit(UnitType.Warrior, 1, 2, 0));

    expect(state.getUnitsForPlayer(0)).toHaveLength(2);
    expect(state.getUnitsForPlayer(1)).toHaveLength(1);
    expect(state.getUnitsForPlayer(2)).toHaveLength(0);
  });
});

describe('GameState — getAllUnits', () => {
  it('returns all units on the board', () => {
    const state = makeState();
    state.addUnit(createUnit(UnitType.Warrior, 0, 0, 0));
    state.addUnit(createUnit(UnitType.Rider, 1, 7, 7));
    expect(state.getAllUnits()).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Movement — basic moves
// ---------------------------------------------------------------------------

describe('GameState — moveUnit', () => {
  it('moves a warrior one tile on a field map', () => {
    const state = makeState();
    const unit = createUnit(UnitType.Warrior, 0, 3, 3);
    state.addUnit(unit);

    expect(state.moveUnit(unit.id, 4, 3)).toBe(true);

    const moved = state.getUnit(unit.id)!;
    expect(moved.x).toBe(4);
    expect(moved.y).toBe(3);
    expect(moved.hasMoved).toBe(true);
  });

  it('rejects movement for a unit that already moved', () => {
    const state = makeState();
    const unit = createUnit(UnitType.Warrior, 0, 3, 3);
    state.addUnit(unit);

    state.moveUnit(unit.id, 4, 3);
    // Second move should fail
    expect(state.moveUnit(unit.id, 5, 3)).toBe(false);
  });

  it('rejects movement to an occupied tile', () => {
    const state = makeState();
    const u1 = createUnit(UnitType.Warrior, 0, 3, 3);
    const u2 = createUnit(UnitType.Warrior, 0, 4, 3);
    state.addUnit(u1);
    state.addUnit(u2);

    expect(state.moveUnit(u1.id, 4, 3)).toBe(false);
  });

  it('rejects movement to a water tile', () => {
    const state = makeState();
    state.map.setTile(4, 3, TileType.ShallowWater);
    const unit = createUnit(UnitType.Warrior, 0, 3, 3);
    state.addUnit(unit);

    expect(state.moveUnit(unit.id, 4, 3)).toBe(false);
  });

  it('rejects movement by the wrong player', () => {
    const state = makeState();
    const unit = createUnit(UnitType.Warrior, 1, 3, 3);
    state.addUnit(unit);

    // Current player is 0
    expect(state.getCurrentPlayer()).toBe(0);
    expect(state.moveUnit(unit.id, 4, 3)).toBe(false);
  });

  it('rejects movement to an out-of-range tile for a warrior', () => {
    const state = makeState();
    const unit = createUnit(UnitType.Warrior, 0, 3, 3);
    state.addUnit(unit);

    // Warrior has movement=1, so (5,3) is 2 tiles away — unreachable
    expect(state.moveUnit(unit.id, 5, 3)).toBe(false);
  });

  it('rejects movement for a non-existent unit', () => {
    const state = makeState();
    expect(state.moveUnit('unit-999', 0, 0)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Movement — rider (movement=2)
// ---------------------------------------------------------------------------

describe('GameState — rider movement', () => {
  it('allows a rider to move 2 tiles across fields', () => {
    const state = makeState();
    const rider = createUnit(UnitType.Rider, 0, 3, 3);
    state.addUnit(rider);

    // Should reach (5,3): cost 1 + 1 = 2
    expect(state.moveUnit(rider.id, 5, 3)).toBe(true);
    const moved = state.getUnit(rider.id)!;
    expect(moved.x).toBe(5);
    expect(moved.y).toBe(3);
  });

  it('a rider cannot move 3 tiles on fields', () => {
    const state = makeState();
    const rider = createUnit(UnitType.Rider, 0, 3, 3);
    state.addUnit(rider);

    // (6,3) is 3 tiles away, rider movement=2
    expect(state.moveUnit(rider.id, 6, 3)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Movement — terrain interactions
// ---------------------------------------------------------------------------

describe('GameState — terrain effects on movement', () => {
  it('allows moving into a forest from an adjacent field (uses all movement)', () => {
    const state = makeState();
    state.map.setTile(4, 3, TileType.Forest);
    const unit = createUnit(UnitType.Warrior, 0, 3, 3);
    state.addUnit(unit);

    // Forest costs all remaining movement; warrior starts with 1
    expect(state.moveUnit(unit.id, 4, 3)).toBe(true);
  });

  it('a rider can enter a forest from an adjacent field', () => {
    const state = makeState();
    state.map.setTile(4, 3, TileType.Forest);
    const rider = createUnit(UnitType.Rider, 0, 3, 3);
    state.addUnit(rider);

    // Rider movement=2, forest costs all remaining. But rider hasn't spent
    // any movement yet, so entering forest from adjacent is allowed.
    expect(state.moveUnit(rider.id, 4, 3)).toBe(true);
  });

  it('a rider cannot reach a tile behind a forest wall', () => {
    const state = makeState();
    // Create a wall of forests blocking the path east
    state.map.setTile(4, 2, TileType.Forest);
    state.map.setTile(4, 3, TileType.Forest);
    state.map.setTile(4, 4, TileType.Forest);
    const rider = createUnit(UnitType.Rider, 0, 3, 3);
    state.addUnit(rider);

    // (5,3) requires going through a forest then continuing — impossible
    // since entering the forest uses all movement.
    // The rider can enter (4,2), (4,3), or (4,4) (forests) but cannot
    // continue past them. And going around means Chebyshev dist > 2.
    expect(state.moveUnit(rider.id, 5, 3)).toBe(false);
  });

  it('allows moving into a mountain from an adjacent field', () => {
    const state = makeState();
    state.map.setTile(4, 3, TileType.Mountain);
    const unit = createUnit(UnitType.Warrior, 0, 3, 3);
    state.addUnit(unit);

    expect(state.moveUnit(unit.id, 4, 3)).toBe(true);
  });

  it('cannot enter ocean', () => {
    const state = makeState();
    state.map.setTile(4, 3, TileType.Ocean);
    const unit = createUnit(UnitType.Warrior, 0, 3, 3);
    state.addUnit(unit);

    expect(state.moveUnit(unit.id, 4, 3)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getMovementRange
// ---------------------------------------------------------------------------

describe('GameState — getMovementRange', () => {
  it('warrior on open field has 8 reachable tiles (movement=1, king\'s-move)', () => {
    const state = makeState();
    const unit = createUnit(UnitType.Warrior, 0, 4, 4);
    state.addUnit(unit);

    const range = state.getMovementRange(unit.id);
    expect(range.size).toBe(8); // all 8 neighbors
  });

  it('warrior in a corner has 3 reachable tiles', () => {
    const state = makeState();
    const unit = createUnit(UnitType.Warrior, 0, 0, 0);
    state.addUnit(unit);

    const range = state.getMovementRange(unit.id);
    expect(range.size).toBe(3);
  });

  it('rider on open field can reach more tiles (movement=2)', () => {
    const state = makeState();
    const rider = createUnit(UnitType.Rider, 0, 4, 4);
    state.addUnit(rider);

    const range = state.getMovementRange(rider.id);
    // Rider movement=2: can reach all tiles within Chebyshev dist 2
    // On an 8x8 map from (4,4), that's a 5x5 square minus center = 24 tiles
    expect(range.size).toBe(24);
  });

  it('excludes tiles occupied by own units from destinations', () => {
    const state = makeState();
    const u1 = createUnit(UnitType.Warrior, 0, 4, 4);
    const u2 = createUnit(UnitType.Warrior, 0, 5, 4);
    state.addUnit(u1);
    state.addUnit(u2);

    const range = state.getMovementRange(u1.id);
    expect(range.has('5,4')).toBe(false);
  });

  it('excludes water tiles', () => {
    const state = makeState();
    state.map.setTile(5, 4, TileType.ShallowWater);
    const unit = createUnit(UnitType.Warrior, 0, 4, 4);
    state.addUnit(unit);

    const range = state.getMovementRange(unit.id);
    expect(range.has('5,4')).toBe(false);
  });

  it('includes forest tiles adjacent to the unit (uses all movement)', () => {
    const state = makeState();
    state.map.setTile(5, 4, TileType.Forest);
    const unit = createUnit(UnitType.Warrior, 0, 4, 4);
    state.addUnit(unit);

    const range = state.getMovementRange(unit.id);
    expect(range.has('5,4')).toBe(true);
  });

  it('returns empty set for non-existent unit', () => {
    const state = makeState();
    const range = state.getMovementRange('unit-999');
    expect(range.size).toBe(0);
  });

  it('allows pathing through friendly units', () => {
    const state = makeState();
    // Place a friendly unit between the rider and a tile 2 away
    const rider = createUnit(UnitType.Rider, 0, 4, 4);
    const ally = createUnit(UnitType.Warrior, 0, 5, 4);
    state.addUnit(rider);
    state.addUnit(ally);

    const range = state.getMovementRange(rider.id);
    // Rider should be able to reach (6,4) by pathing through (5,4)
    expect(range.has('6,4')).toBe(true);
    // But cannot stop on (5,4) since it's occupied
    expect(range.has('5,4')).toBe(false);
  });

  it('does not allow pathing through enemy units', () => {
    const state = makeState();
    // Surround a warrior with enemy units on one side
    const unit = createUnit(UnitType.Rider, 0, 0, 4);
    const enemy = createUnit(UnitType.Warrior, 1, 1, 4);
    state.addUnit(unit);
    state.addUnit(enemy);

    const range = state.getMovementRange(unit.id);
    // Can't path through (1,4) to reach (2,4)
    expect(range.has('1,4')).toBe(false);
    // But can go around: (1,3), (1,5) are reachable
    expect(range.has('1,3')).toBe(true);
    expect(range.has('1,5')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Turn management
// ---------------------------------------------------------------------------

describe('GameState — turn management', () => {
  it('starts on player 0', () => {
    const state = makeState();
    expect(state.getCurrentPlayer()).toBe(0);
  });

  it('endTurn advances to the next player', () => {
    const state = makeState();
    state.endTurn();
    expect(state.getCurrentPlayer()).toBe(1);
  });

  it('endTurn wraps around to player 0', () => {
    const state = makeState();
    state.endTurn(); // -> 1
    state.endTurn(); // -> 0
    expect(state.getCurrentPlayer()).toBe(0);
  });

  it('endTurn resets hasMoved for the new current player\'s units', () => {
    const state = makeState();
    const unit = createUnit(UnitType.Warrior, 0, 3, 3);
    state.addUnit(unit);

    // Move the unit
    state.moveUnit(unit.id, 4, 3);
    expect(state.getUnit(unit.id)!.hasMoved).toBe(true);

    // End turn twice to come back to player 0
    state.endTurn(); // -> player 1
    state.endTurn(); // -> player 0 (resets player 0's units)

    expect(state.getUnit(unit.id)!.hasMoved).toBe(false);
  });

  it('starts at turn number 1', () => {
    const state = makeState();
    expect(state.getTurnNumber()).toBe(1);
  });

  it('turn number stays at 1 after player 0 ends turn (mid-round)', () => {
    const state = makeState();
    state.endTurn(); // -> player 1 (still turn 1)
    expect(state.getTurnNumber()).toBe(1);
  });

  it('turn number increments to 2 after a full round (both players end turn)', () => {
    const state = makeState();
    state.endTurn(); // -> player 1
    state.endTurn(); // -> player 0 (turn 2)
    expect(state.getTurnNumber()).toBe(2);
  });

  it('turn number increments correctly over multiple rounds', () => {
    const state = makeState();
    // 4 endTurn calls = 2 full rounds -> turn 3
    state.endTurn(); // -> player 1 (turn 1)
    state.endTurn(); // -> player 0 (turn 2)
    state.endTurn(); // -> player 1 (turn 2)
    state.endTurn(); // -> player 0 (turn 3)
    expect(state.getTurnNumber()).toBe(3);
    expect(state.getCurrentPlayer()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// UnitFactory
// ---------------------------------------------------------------------------

describe('UnitFactory — createUnit', () => {
  it('creates a warrior with correct stats', () => {
    const unit = createUnit(UnitType.Warrior, 0, 5, 5);
    expect(unit.type).toBe(UnitType.Warrior);
    expect(unit.owner).toBe(0);
    expect(unit.x).toBe(5);
    expect(unit.y).toBe(5);
    expect(unit.currentHp).toBe(10);
    expect(unit.maxHp).toBe(10);
    expect(unit.atk).toBe(2);
    expect(unit.def).toBe(2);
    expect(unit.movement).toBe(1);
    expect(unit.range).toBe(1);
    expect(unit.hasMoved).toBe(false);
    expect(unit.hasAttacked).toBe(false);
  });

  it('creates a rider with movement=2', () => {
    const unit = createUnit(UnitType.Rider, 1, 0, 0);
    expect(unit.movement).toBe(2);
    expect(unit.type).toBe(UnitType.Rider);
    expect(unit.owner).toBe(1);
  });

  it('generates unique IDs', () => {
    const u1 = createUnit(UnitType.Warrior, 0, 0, 0);
    const u2 = createUnit(UnitType.Warrior, 0, 1, 0);
    expect(u1.id).not.toBe(u2.id);
  });
});

// ---------------------------------------------------------------------------
// parseCoordKey
// ---------------------------------------------------------------------------

describe('GameState.parseCoordKey', () => {
  it('parses a comma-separated coordinate string', () => {
    expect(GameState.parseCoordKey('3,7')).toEqual({ x: 3, y: 7 });
  });

  it('handles zero coordinates', () => {
    expect(GameState.parseCoordKey('0,0')).toEqual({ x: 0, y: 0 });
  });
});
