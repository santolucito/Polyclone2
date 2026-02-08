/**
 * Core grid model for PolyClone2.
 * Pure TypeScript — no browser or rendering dependencies.
 *
 * Movement costs and defense bonuses are derived from the design docs:
 *   docs/design/map-generation.md  (terrain types table)
 *   docs/design/game-mechanics.md  (movement §10, combat §1)
 */

import { Coord, Tile, TileType } from './types.js';

/**
 * Movement cost returned when a tile is impassable or "uses all remaining
 * movement". We use a large finite number rather than Infinity so that
 * arithmetic stays well-defined. Any value >= 99 should be treated as
 * "unit must stop / cannot enter".
 */
const IMPASSABLE_COST = 99;

export class GameMap {
  readonly width: number;
  readonly height: number;

  /** Row-major 2-D grid: tiles[y][x]. */
  private readonly tiles: Tile[][];

  // ---------------------------------------------------------------------------
  // Construction
  // ---------------------------------------------------------------------------

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = [];

    for (let y = 0; y < height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        row.push({ type: TileType.Field, x, y });
      }
      this.tiles.push(row);
    }
  }

  /**
   * Factory: create a map pre-filled with a single terrain type.
   * Defaults to Field if no fillType is specified.
   */
  static create(width: number, height: number, fillType?: TileType): GameMap {
    const map = new GameMap(width, height);
    const fill = fillType ?? TileType.Field;

    if (fill !== TileType.Field) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          map.tiles[y][x] = { ...map.tiles[y][x], type: fill };
        }
      }
    }

    return map;
  }

  // ---------------------------------------------------------------------------
  // Tile access
  // ---------------------------------------------------------------------------

  /** Returns the tile at (x, y), or null if the coordinates are out of bounds. */
  getTile(x: number, y: number): Tile | null {
    if (!this.isInBounds(x, y)) return null;
    return this.tiles[y][x];
  }

  /** Set the terrain type of the tile at (x, y). No-op if out of bounds. */
  setTile(x: number, y: number, type: TileType): void {
    if (!this.isInBounds(x, y)) return;
    this.tiles[y][x] = { ...this.tiles[y][x], type };
  }

  /** Returns true when (x, y) lies within the map boundaries. */
  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  // ---------------------------------------------------------------------------
  // Neighbor / range queries (Chebyshev / king's-move adjacency)
  // ---------------------------------------------------------------------------

  /**
   * Returns all valid tiles that are king's-move adjacent to (x, y).
   * Up to 8 neighbors; corners have 3, edges 5, interior 8.
   */
  getNeighbors(x: number, y: number): Tile[] {
    const neighbors: Tile[] = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const tile = this.getTile(x + dx, y + dy);
        if (tile !== null) {
          neighbors.push(tile);
        }
      }
    }

    return neighbors;
  }

  /**
   * Returns all tiles within Chebyshev distance `range` of (x, y),
   * **excluding** the origin tile itself.
   */
  getTilesInRange(x: number, y: number, range: number): Tile[] {
    const result: Tile[] = [];

    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        if (dx === 0 && dy === 0) continue;
        const tile = this.getTile(x + dx, y + dy);
        if (tile !== null) {
          result.push(tile);
        }
      }
    }

    return result;
  }

  /**
   * Returns all tiles visible from (x, y) with the given vision range.
   * For now this is identical to getTilesInRange (no line-of-sight blocking).
   */
  getVisibleTiles(x: number, y: number, visionRange: number): Tile[] {
    return this.getTilesInRange(x, y, visionRange);
  }

  // ---------------------------------------------------------------------------
  // Gameplay helpers
  // ---------------------------------------------------------------------------

  /**
   * Movement cost to step from `from` into `to`.
   *
   * Based on game-mechanics.md §10:
   *   Field -> Field  : 1.0
   *   Entering forest  : uses all remaining movement (99)
   *   Entering mountain: uses all remaining movement (99)
   *   Water (shallow / ocean): impassable for now (99)
   */
  getMovementCost(_from: Coord, to: Coord): number {
    const dest = this.getTile(to.x, to.y);
    if (dest === null) return IMPASSABLE_COST;

    switch (dest.type) {
      case TileType.Field:
        return 1.0;
      case TileType.Forest:
        return IMPASSABLE_COST;
      case TileType.Mountain:
        return IMPASSABLE_COST;
      case TileType.ShallowWater:
        return IMPASSABLE_COST;
      case TileType.Ocean:
        return IMPASSABLE_COST;
    }
  }

  /**
   * Defense multiplier for a unit standing on tile (x, y).
   *
   * Based on game-mechanics.md §1 defense bonuses:
   *   Field         : 1.0x
   *   Forest        : 1.5x
   *   Mountain      : 1.5x
   *   Shallow Water : 1.5x
   *   Ocean         : 1.5x
   */
  getDefenseBonus(x: number, y: number): number {
    const tile = this.getTile(x, y);
    if (tile === null) return 1.0;

    switch (tile.type) {
      case TileType.Field:
        return 1.0;
      case TileType.Forest:
        return 1.5;
      case TileType.Mountain:
        return 1.5;
      case TileType.ShallowWater:
        return 1.5;
      case TileType.Ocean:
        return 1.5;
    }
  }
}
