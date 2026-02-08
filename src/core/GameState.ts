/**
 * Core game state for PolyClone2.
 * Manages units, players, and the game map.
 * Pure TypeScript -- no browser or rendering dependencies.
 */

import { GameMap } from './GameMap.js';
import { Coord, GameConfig, TileType, UnitInstance } from './types.js';

/** Sentinel cost used by GameMap to indicate impassable terrain. */
const IMPASSABLE_COST = 99;

export class GameState {
  readonly map: GameMap;
  readonly config: GameConfig;
  readonly playerCount: number;
  private currentPlayer: number = 0;

  /** All live units, keyed by unit ID. */
  private readonly units: Map<string, UnitInstance> = new Map();

  constructor(map: GameMap, config: GameConfig) {
    this.map = map;
    this.config = config;
    this.playerCount = config.tribes.length;
  }

  // ---------------------------------------------------------------------------
  // Player
  // ---------------------------------------------------------------------------

  /** Returns the index of the player whose turn it is. */
  getCurrentPlayer(): number {
    return this.currentPlayer;
  }

  /** Advances to the next player's turn and resets all their units' moved/attacked flags. */
  endTurn(): void {
    this.currentPlayer = (this.currentPlayer + 1) % this.playerCount;
    // Reset moved/attacked flags for the new current player's units
    for (const [id, unit] of this.units) {
      if (unit.owner === this.currentPlayer) {
        this.units.set(id, { ...unit, hasMoved: false, hasAttacked: false });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Unit CRUD
  // ---------------------------------------------------------------------------

  /** Add a unit to the game. Returns false if a unit already exists at that position. */
  addUnit(unit: UnitInstance): boolean {
    if (this.getUnitAt(unit.x, unit.y) !== undefined) {
      return false;
    }
    this.units.set(unit.id, unit);
    return true;
  }

  /** Remove a unit by ID. Returns true if the unit was found and removed. */
  removeUnit(unitId: string): boolean {
    return this.units.delete(unitId);
  }

  /** Get a unit by ID, or undefined if not found. */
  getUnit(unitId: string): UnitInstance | undefined {
    return this.units.get(unitId);
  }

  /** Get the unit at grid position (x, y), or undefined if no unit is there. */
  getUnitAt(x: number, y: number): UnitInstance | undefined {
    for (const unit of this.units.values()) {
      if (unit.x === x && unit.y === y) return unit;
    }
    return undefined;
  }

  /** Get all units belonging to a player. */
  getUnitsForPlayer(playerId: number): UnitInstance[] {
    const result: UnitInstance[] = [];
    for (const unit of this.units.values()) {
      if (unit.owner === playerId) result.push(unit);
    }
    return result;
  }

  /** Get all units on the board. */
  getAllUnits(): UnitInstance[] {
    return Array.from(this.units.values());
  }

  // ---------------------------------------------------------------------------
  // Movement
  // ---------------------------------------------------------------------------

  /**
   * Attempt to move a unit to (toX, toY).
   * Returns true if the move succeeded; false if invalid.
   *
   * Validation:
   *   - Unit must exist and belong to the current player
   *   - Unit must not have moved this turn
   *   - Destination must be in bounds
   *   - Destination must be passable (not water for land units)
   *   - Destination must not be occupied by another unit
   *   - Destination must be within the unit's movement range
   */
  moveUnit(unitId: string, toX: number, toY: number): boolean {
    const unit = this.units.get(unitId);
    if (unit === undefined) return false;
    if (unit.owner !== this.currentPlayer) return false;
    if (unit.hasMoved) return false;

    // Check destination is in movement range
    const reachable = this.getMovementRange(unitId);
    const key = `${toX},${toY}`;
    if (!reachable.has(key)) return false;

    // Move the unit
    this.units.set(unitId, {
      ...unit,
      x: toX,
      y: toY,
      hasMoved: true,
    });

    return true;
  }

  /**
   * Computes the set of tiles a unit can move to using BFS.
   *
   * Returns a Set of "x,y" coordinate strings for all reachable positions.
   * The unit's own tile is NOT included in the result.
   *
   * Movement rules:
   *   - BFS from the unit's current position
   *   - Each step costs the movement cost of the destination terrain
   *   - If cost >= 99, the tile is treated as impassable (water for land units)
   *     UNLESS the unit has remaining movement equal to its full movement
   *     stat and the terrain costs 99 (forests/mountains "use all remaining
   *     movement" — meaning you can enter them if you haven't moved yet,
   *     but can't move further)
   *   - A tile occupied by another unit is not a valid destination but can
   *     be pathed through if it belongs to the same player
   */
  getMovementRange(unitId: string): Set<string> {
    const unit = this.units.get(unitId);
    if (unit === undefined) return new Set();

    const reachable = new Set<string>();
    // BFS: each entry is { x, y, remainingMovement }
    const visited = new Map<string, number>(); // key -> best remaining movement
    const queue: { x: number; y: number; remaining: number }[] = [];

    const startKey = `${unit.x},${unit.y}`;
    visited.set(startKey, unit.movement);
    queue.push({ x: unit.x, y: unit.y, remaining: unit.movement });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.map.getNeighbors(current.x, current.y);

      for (const neighbor of neighbors) {
        const cost = this.map.getMovementCost(
          { x: current.x, y: current.y },
          { x: neighbor.x, y: neighbor.y },
        );

        // Determine if we can enter this tile
        let newRemaining: number;

        if (this.isWaterTile(neighbor.x, neighbor.y)) {
          // Water is truly impassable for land units
          continue;
        }

        if (cost >= IMPASSABLE_COST) {
          // Forest/mountain: can enter only if we have full remaining movement
          // (i.e., from the unit's starting position or after not spending movement)
          // and it uses ALL remaining movement (remaining becomes 0)
          if (current.remaining >= unit.movement && unit.movement >= 1) {
            newRemaining = 0;
          } else {
            continue;
          }
        } else {
          if (current.remaining < cost) continue;
          newRemaining = current.remaining - cost;
        }

        const nKey = `${neighbor.x},${neighbor.y}`;
        const prevBest = visited.get(nKey);

        if (prevBest !== undefined && prevBest >= newRemaining) {
          continue; // Already visited with equal or more remaining movement
        }

        visited.set(nKey, newRemaining);

        // Check if there's a unit on this tile
        const occupant = this.getUnitAt(neighbor.x, neighbor.y);

        if (occupant === undefined) {
          // Empty tile: valid destination
          reachable.add(nKey);
        }
        // If occupant is friendly, we can path through but not stop here
        // If occupant is enemy, we cannot path through at all
        if (occupant !== undefined && occupant.owner !== unit.owner) {
          continue; // Can't path through enemy units
        }

        // Continue BFS from this tile (even if occupied by friendly, we path through)
        if (newRemaining > 0) {
          queue.push({ x: neighbor.x, y: neighbor.y, remaining: newRemaining });
        }
      }
    }

    return reachable;
  }

  /**
   * Parses a "x,y" key back into a Coord.
   */
  static parseCoordKey(key: string): Coord {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private isWaterTile(x: number, y: number): boolean {
    const tile = this.map.getTile(x, y);
    if (tile === null) return false;
    return tile.type === TileType.ShallowWater || tile.type === TileType.Ocean;
  }
}
