import { describe, it, expect } from 'vitest';
import { GameMap } from '@core/GameMap';
import { TileType } from '@core/types';

// ---------------------------------------------------------------------------
// Construction & dimensions
// ---------------------------------------------------------------------------

describe('GameMap construction', () => {
  it('stores width and height', () => {
    const map = new GameMap(11, 14);
    expect(map.width).toBe(11);
    expect(map.height).toBe(14);
  });

  it('defaults every tile to Field', () => {
    const map = new GameMap(4, 4);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const tile = map.getTile(x, y);
        expect(tile).not.toBeNull();
        expect(tile!.type).toBe(TileType.Field);
        expect(tile!.x).toBe(x);
        expect(tile!.y).toBe(y);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Static factory
// ---------------------------------------------------------------------------

describe('GameMap.create', () => {
  it('creates a map filled with the specified terrain type', () => {
    const map = GameMap.create(5, 5, TileType.Forest);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        expect(map.getTile(x, y)!.type).toBe(TileType.Forest);
      }
    }
  });

  it('defaults to Field when no fill type is given', () => {
    const map = GameMap.create(3, 3);
    expect(map.getTile(1, 1)!.type).toBe(TileType.Field);
  });

  it('preserves correct width and height', () => {
    const map = GameMap.create(16, 18, TileType.Mountain);
    expect(map.width).toBe(16);
    expect(map.height).toBe(18);
  });
});

// ---------------------------------------------------------------------------
// getTile / isInBounds
// ---------------------------------------------------------------------------

describe('getTile and isInBounds', () => {
  const map = new GameMap(5, 5);

  it('returns the tile for valid coordinates', () => {
    const tile = map.getTile(0, 0);
    expect(tile).not.toBeNull();
    expect(tile!.x).toBe(0);
    expect(tile!.y).toBe(0);
  });

  it('returns null for negative x', () => {
    expect(map.getTile(-1, 0)).toBeNull();
  });

  it('returns null for negative y', () => {
    expect(map.getTile(0, -1)).toBeNull();
  });

  it('returns null for x >= width', () => {
    expect(map.getTile(5, 0)).toBeNull();
  });

  it('returns null for y >= height', () => {
    expect(map.getTile(0, 5)).toBeNull();
  });

  it('isInBounds matches getTile nullability', () => {
    expect(map.isInBounds(0, 0)).toBe(true);
    expect(map.isInBounds(4, 4)).toBe(true);
    expect(map.isInBounds(-1, 0)).toBe(false);
    expect(map.isInBounds(5, 0)).toBe(false);
    expect(map.isInBounds(0, 5)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setTile
// ---------------------------------------------------------------------------

describe('setTile', () => {
  it('changes the tile type at a valid position', () => {
    const map = new GameMap(5, 5);
    map.setTile(2, 3, TileType.Mountain);
    expect(map.getTile(2, 3)!.type).toBe(TileType.Mountain);
  });

  it('is a no-op for out-of-bounds coordinates', () => {
    const map = new GameMap(5, 5);
    // Should not throw
    map.setTile(-1, 0, TileType.Ocean);
    map.setTile(5, 5, TileType.Ocean);
  });
});

// ---------------------------------------------------------------------------
// getNeighbors (Chebyshev / king's-move)
// ---------------------------------------------------------------------------

describe('getNeighbors', () => {
  const map = new GameMap(5, 5);

  it('returns 3 neighbors for a corner tile', () => {
    // Top-left corner (0,0)
    expect(map.getNeighbors(0, 0)).toHaveLength(3);
    // Top-right corner (4,0)
    expect(map.getNeighbors(4, 0)).toHaveLength(3);
    // Bottom-left corner (0,4)
    expect(map.getNeighbors(0, 4)).toHaveLength(3);
    // Bottom-right corner (4,4)
    expect(map.getNeighbors(4, 4)).toHaveLength(3);
  });

  it('returns 5 neighbors for an edge tile', () => {
    // Top edge, non-corner
    expect(map.getNeighbors(2, 0)).toHaveLength(5);
    // Left edge, non-corner
    expect(map.getNeighbors(0, 2)).toHaveLength(5);
    // Bottom edge, non-corner
    expect(map.getNeighbors(2, 4)).toHaveLength(5);
    // Right edge, non-corner
    expect(map.getNeighbors(4, 2)).toHaveLength(5);
  });

  it('returns 8 neighbors for an interior tile', () => {
    expect(map.getNeighbors(2, 2)).toHaveLength(8);
    expect(map.getNeighbors(1, 1)).toHaveLength(8);
    expect(map.getNeighbors(3, 3)).toHaveLength(8);
  });

  it('does not include the origin tile itself', () => {
    const neighbors = map.getNeighbors(2, 2);
    const containsOrigin = neighbors.some((t) => t.x === 2 && t.y === 2);
    expect(containsOrigin).toBe(false);
  });

  it('returns the correct neighbor coordinates for a corner', () => {
    const neighbors = map.getNeighbors(0, 0);
    const coords = neighbors.map((t) => ({ x: t.x, y: t.y }));
    expect(coords).toEqual(
      expect.arrayContaining([
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// Movement costs
// ---------------------------------------------------------------------------

describe('getMovementCost', () => {
  it('returns 1.0 for field-to-field movement', () => {
    const map = GameMap.create(5, 5, TileType.Field);
    expect(map.getMovementCost({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(1.0);
  });

  it('returns 99 when entering a forest', () => {
    const map = GameMap.create(5, 5, TileType.Field);
    map.setTile(2, 2, TileType.Forest);
    expect(map.getMovementCost({ x: 1, y: 2 }, { x: 2, y: 2 })).toBe(99);
  });

  it('returns 99 when entering a mountain', () => {
    const map = GameMap.create(5, 5, TileType.Field);
    map.setTile(3, 3, TileType.Mountain);
    expect(map.getMovementCost({ x: 2, y: 3 }, { x: 3, y: 3 })).toBe(99);
  });

  it('returns 99 for shallow water (impassable for now)', () => {
    const map = GameMap.create(5, 5, TileType.Field);
    map.setTile(1, 1, TileType.ShallowWater);
    expect(map.getMovementCost({ x: 0, y: 1 }, { x: 1, y: 1 })).toBe(99);
  });

  it('returns 99 for ocean (impassable for now)', () => {
    const map = GameMap.create(5, 5, TileType.Field);
    map.setTile(1, 1, TileType.Ocean);
    expect(map.getMovementCost({ x: 0, y: 1 }, { x: 1, y: 1 })).toBe(99);
  });

  it('returns 99 when destination is out of bounds', () => {
    const map = GameMap.create(5, 5, TileType.Field);
    expect(map.getMovementCost({ x: 4, y: 0 }, { x: 5, y: 0 })).toBe(99);
  });
});

// ---------------------------------------------------------------------------
// Defense bonuses
// ---------------------------------------------------------------------------

describe('getDefenseBonus', () => {
  it('returns 1.0 for field', () => {
    const map = GameMap.create(5, 5, TileType.Field);
    expect(map.getDefenseBonus(2, 2)).toBe(1.0);
  });

  it('returns 1.5 for forest', () => {
    const map = GameMap.create(5, 5, TileType.Field);
    map.setTile(2, 2, TileType.Forest);
    expect(map.getDefenseBonus(2, 2)).toBe(1.5);
  });

  it('returns 1.5 for mountain', () => {
    const map = GameMap.create(5, 5, TileType.Field);
    map.setTile(2, 2, TileType.Mountain);
    expect(map.getDefenseBonus(2, 2)).toBe(1.5);
  });

  it('returns 1.5 for shallow water', () => {
    const map = GameMap.create(5, 5, TileType.ShallowWater);
    expect(map.getDefenseBonus(0, 0)).toBe(1.5);
  });

  it('returns 1.5 for ocean', () => {
    const map = GameMap.create(5, 5, TileType.Ocean);
    expect(map.getDefenseBonus(0, 0)).toBe(1.5);
  });

  it('returns 1.0 for out-of-bounds coordinates', () => {
    const map = GameMap.create(5, 5, TileType.Field);
    expect(map.getDefenseBonus(-1, -1)).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// getTilesInRange
// ---------------------------------------------------------------------------

describe('getTilesInRange', () => {
  it('with range 1 returns same as getNeighbors', () => {
    const map = new GameMap(5, 5);
    const inRange = map.getTilesInRange(2, 2, 1);
    const neighbors = map.getNeighbors(2, 2);
    expect(inRange).toHaveLength(neighbors.length);
  });

  it('does not include the origin tile', () => {
    const map = new GameMap(5, 5);
    const tiles = map.getTilesInRange(2, 2, 2);
    const containsOrigin = tiles.some((t) => t.x === 2 && t.y === 2);
    expect(containsOrigin).toBe(false);
  });

  it('returns correct count for range 2 in the center of a large map', () => {
    // 5x5 square minus the center tile = 24 tiles
    const map = new GameMap(10, 10);
    const tiles = map.getTilesInRange(5, 5, 2);
    expect(tiles).toHaveLength(24);
  });

  it('clips to map boundaries', () => {
    const map = new GameMap(5, 5);
    // Corner (0,0) with range 2: only the 3x3 quadrant minus origin = 8 tiles
    const tiles = map.getTilesInRange(0, 0, 2);
    expect(tiles).toHaveLength(8);
  });

  it('with range 0 returns an empty array', () => {
    const map = new GameMap(5, 5);
    expect(map.getTilesInRange(2, 2, 0)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getVisibleTiles
// ---------------------------------------------------------------------------

describe('getVisibleTiles', () => {
  it('returns the same result as getTilesInRange (no LOS blocking yet)', () => {
    const map = new GameMap(10, 10);
    const visible = map.getVisibleTiles(5, 5, 2);
    const inRange = map.getTilesInRange(5, 5, 2);
    expect(visible).toEqual(inRange);
  });

  it('standard unit vision (range 1) from center yields 8 tiles', () => {
    const map = new GameMap(10, 10);
    expect(map.getVisibleTiles(5, 5, 1)).toHaveLength(8);
  });

  it('mountain vision (range 2) from center yields 24 tiles', () => {
    const map = new GameMap(10, 10);
    expect(map.getVisibleTiles(5, 5, 2)).toHaveLength(24);
  });
});
