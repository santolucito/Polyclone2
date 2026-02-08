/**
 * Core game state for PolyClone2.
 * Manages units, players, cities, economy, combat, tech, and the game map.
 * Pure TypeScript -- no browser or rendering dependencies.
 */

import { GameMap } from './GameMap.js';
import {
  CityInstance,
  CityLevelRewardOption,
  Coord,
  Difficulty,
  GameConfig,
  TechId,
  TileType,
  TribeId,
  UnitInstance,
  UnitType,
} from './types.js';
import { PlayerTechState, calculateTechCost } from './TechTree.js';
import { resolveCombat, getDefenseBonusForTerrain, getCityDefenseBonus } from './Combat.js';
import { calculateCityIncome, levelUp, canLevelUp } from './City.js';
import { createUnit, getUnitBaseStats } from './UnitFactory.js';

/** Sentinel cost used by GameMap to indicate impassable terrain. */
const IMPASSABLE_COST = 99;

/** Starting stars per player. */
const STARTING_STARS = 5;

/** AI difficulty bonus SPT. */
const AI_DIFFICULTY_BONUS: Record<Difficulty, number> = {
  easy: 1,
  normal: 2,
  hard: 3,
  crazy: 5,
};

/** Starting tech per tribe. */
const TRIBE_STARTING_TECH: Partial<Record<TribeId, TechId>> = {
  xinxi: 'climbing',
  imperius: 'organization',
  bardur: 'hunting',
  oumaji: 'riding',
};

export class GameState {
  readonly map: GameMap;
  readonly config: GameConfig;
  readonly playerCount: number;
  private currentPlayer: number = 0;
  private turnNumber: number = 1;

  /** All live units, keyed by unit ID. */
  private readonly units: Map<string, UnitInstance> = new Map();

  /** Per-player star balance. */
  private readonly stars: number[];

  /** Per-player tech state. */
  private readonly techStates: PlayerTechState[];

  /** All cities on the map. */
  private readonly cities: CityInstance[] = [];

  /** Whether the game has been won (player index, or -1 for none). */
  private winner: number = -1;

  constructor(map: GameMap, config: GameConfig) {
    this.map = map;
    this.config = config;
    this.playerCount = config.tribes.length;

    // Initialize stars
    this.stars = new Array(this.playerCount).fill(STARTING_STARS);

    // Initialize tech states with tribe starting techs
    this.techStates = config.tribes.map(tribeId => {
      const startingTech = TRIBE_STARTING_TECH[tribeId];
      return new PlayerTechState(startingTech ? [startingTech] : []);
    });
  }

  // ---------------------------------------------------------------------------
  // Player
  // ---------------------------------------------------------------------------

  /** Returns the index of the player whose turn it is. */
  getCurrentPlayer(): number {
    return this.currentPlayer;
  }

  /** Returns the current turn number (increments after all players have taken a turn). */
  getTurnNumber(): number {
    return this.turnNumber;
  }

  /** Get the tribe ID for a player index. */
  getTribeForPlayer(player: number): TribeId {
    return this.config.tribes[player];
  }

  /** Returns the winner player index, or -1 if no winner yet. */
  getWinner(): number {
    return this.winner;
  }

  /** Advances to the next player's turn, collects income, and resets unit flags. */
  endTurn(): void {
    this.currentPlayer = (this.currentPlayer + 1) % this.playerCount;
    // Increment turn number when it wraps back to player 0 (a full round completed)
    if (this.currentPlayer === 0) {
      this.turnNumber++;
    }

    // Collect income for the new current player
    this.collectIncome(this.currentPlayer);

    // Reset moved/attacked flags for the new current player's units
    for (const [id, unit] of this.units) {
      if (unit.owner === this.currentPlayer) {
        this.units.set(id, { ...unit, hasMoved: false, hasAttacked: false });
      }
    }

    // Check domination win condition
    this.checkWinCondition();
  }

  // ---------------------------------------------------------------------------
  // Star Economy
  // ---------------------------------------------------------------------------

  /** Get the star balance for a player. */
  getStars(player: number): number {
    return this.stars[player] ?? 0;
  }

  /** Spend stars. Returns false if insufficient. */
  spendStars(player: number, amount: number): boolean {
    if (this.stars[player] === undefined || this.stars[player] < amount) return false;
    this.stars[player] -= amount;
    return true;
  }

  /** Add stars to a player. */
  addStars(player: number, amount: number): void {
    if (this.stars[player] !== undefined) {
      this.stars[player] += amount;
    }
  }

  /** Calculate total income for a player. */
  getIncome(player: number): number {
    const tribeId = this.config.tribes[player];
    const playerCities = this.getCitiesForPlayer(tribeId);
    let income = 0;
    for (const city of playerCities) {
      income += calculateCityIncome(city);
    }
    // AI difficulty bonus (player 0 is always human)
    if (player > 0) {
      income += AI_DIFFICULTY_BONUS[this.config.difficulty];
    }
    return income;
  }

  /** Collect income at turn start for the given player. */
  private collectIncome(player: number): void {
    const income = this.getIncome(player);
    this.addStars(player, income);
  }

  // ---------------------------------------------------------------------------
  // Cities
  // ---------------------------------------------------------------------------

  /** Add a city to the game. */
  addCity(city: CityInstance): void {
    this.cities.push(city);
  }

  /** Get all cities belonging to a tribe. */
  getCitiesForPlayer(owner: TribeId): CityInstance[] {
    return this.cities.filter(c => c.owner === owner);
  }

  /** Get the city at a grid position, or undefined if none. */
  getCityAt(x: number, y: number): CityInstance | undefined {
    return this.cities.find(c => c.position.x === x && c.position.y === y);
  }

  /** Get all cities. */
  getAllCities(): CityInstance[] {
    return [...this.cities];
  }

  /** Get the number of cities owned by a player (by index). */
  getCityCountForPlayer(player: number): number {
    const tribeId = this.config.tribes[player];
    return this.cities.filter(c => c.owner === tribeId).length;
  }

  /** Capture a city: change its owner to the given tribe. */
  captureCity(x: number, y: number, newOwner: TribeId): boolean {
    const city = this.getCityAt(x, y);
    if (!city) return false;
    if (city.owner === newOwner) return false;
    this.updateCity({ ...city, owner: newOwner, isCapital: false });
    return true;
  }

  /** Update a city in-place (replaces the city at the same position). */
  private updateCity(updated: CityInstance): void {
    const idx = this.cities.findIndex(
      c => c.position.x === updated.position.x && c.position.y === updated.position.y,
    );
    if (idx >= 0) {
      this.cities[idx] = updated;
    }
  }

  /**
   * Level up a city with the chosen reward.
   * Returns the reward option if successful, undefined otherwise.
   */
  levelUpCity(cityX: number, cityY: number, reward: CityLevelRewardOption): CityLevelRewardOption | undefined {
    const city = this.getCityAt(cityX, cityY);
    if (!city) return undefined;
    if (!canLevelUp(city)) return undefined;

    const updated = levelUp(city, reward);
    this.updateCity(updated);

    // Handle external reward effects
    if (reward.kind === 'stars') {
      const player = this.getPlayerForTribe(city.owner);
      if (player >= 0) {
        this.addStars(player, reward.amount);
      }
    }

    return reward;
  }

  // ---------------------------------------------------------------------------
  // Combat
  // ---------------------------------------------------------------------------

  /**
   * Execute an attack from one unit to a target position.
   * Returns the combat result summary, or undefined if invalid.
   */
  attackUnit(
    attackerId: string,
    targetX: number,
    targetY: number,
  ): { damageToDefender: number; damageToAttacker: number; defenderKilled: boolean; attackerKilled: boolean } | undefined {
    const attacker = this.units.get(attackerId);
    if (!attacker) return undefined;
    if (attacker.owner !== this.currentPlayer) return undefined;
    if (attacker.hasAttacked) return undefined;

    const defender = this.getUnitAt(targetX, targetY);
    if (!defender) return undefined;
    if (defender.owner === attacker.owner) return undefined;

    // Check range (Chebyshev distance)
    const dist = Math.max(Math.abs(attacker.x - targetX), Math.abs(attacker.y - targetY));
    if (dist > attacker.range) return undefined;

    // Calculate defense bonus
    const tile = this.map.getTile(targetX, targetY);
    let defenseBonus = tile ? getDefenseBonusForTerrain(tile.type) : 1.0;

    // City defense bonus overrides terrain if defender is in a city
    const defenderCity = this.getCityAt(targetX, targetY);
    if (defenderCity) {
      defenseBonus = getCityDefenseBonus(defenderCity.hasWall);
    }

    const result = resolveCombat(attacker, defender, defenseBonus, dist);

    // Apply results
    if (result.defenderKilled) {
      this.units.delete(defender.id);
    } else {
      this.units.set(defender.id, result.defender);
    }

    if (result.attackerKilled) {
      this.units.delete(attacker.id);
    } else {
      this.units.set(attacker.id, result.attacker);
    }

    return {
      damageToDefender: result.damageToDefender,
      damageToAttacker: result.damageToAttacker,
      defenderKilled: result.defenderKilled,
      attackerKilled: result.attackerKilled,
    };
  }

  // ---------------------------------------------------------------------------
  // Technology
  // ---------------------------------------------------------------------------

  /** Get the tech state for a player. */
  getTechState(player: number): PlayerTechState {
    return this.techStates[player];
  }

  /**
   * Research a technology for the current player.
   * Returns true if successful.
   */
  researchTech(player: number, techId: TechId): boolean {
    const techState = this.techStates[player];
    if (!techState) return false;
    if (!techState.canResearch(techId)) return false;

    const numCities = this.getCityCountForPlayer(player);
    const cost = calculateTechCost(techId, Math.max(1, numCities), techState.hasLiteracy());

    if (!this.spendStars(player, cost)) return false;

    techState.research(techId);
    return true;
  }

  /** Get the cost of a tech for a player. */
  getTechCost(player: number, techId: TechId): number {
    const techState = this.techStates[player];
    const numCities = this.getCityCountForPlayer(player);
    return calculateTechCost(techId, Math.max(1, numCities), techState?.hasLiteracy() ?? false);
  }

  // ---------------------------------------------------------------------------
  // Unit Training
  // ---------------------------------------------------------------------------

  /**
   * Train a unit at a city position.
   * Returns the created unit, or undefined if invalid.
   */
  trainUnit(cityX: number, cityY: number, unitType: UnitType): UnitInstance | undefined {
    const city = this.getCityAt(cityX, cityY);
    if (!city) return undefined;

    const player = this.getPlayerForTribe(city.owner);
    if (player < 0) return undefined;
    if (player !== this.currentPlayer) return undefined;

    // Check tech unlock (warriors are always available)
    if (unitType !== UnitType.Warrior) {
      const techState = this.techStates[player];
      if (!techState || !techState.isUnitUnlocked(unitType)) return undefined;
    }

    // Check cost
    const stats = getUnitBaseStats(unitType);
    if (stats.cost === null) return undefined; // Not trainable (Giant, etc.)
    if (!this.spendStars(player, stats.cost)) return undefined;

    // Check tile is empty
    if (this.getUnitAt(cityX, cityY) !== undefined) return undefined;

    const unit = createUnit(unitType, player, cityX, cityY);
    this.addUnit(unit);
    return unit;
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

    // Capture city at destination if enemy or neutral
    const city = this.getCityAt(toX, toY);
    if (city) {
      const ownerTribe = this.getTribeForPlayer(unit.owner);
      if (city.owner !== ownerTribe) {
        this.captureCity(toX, toY, ownerTribe);
      }
    }

    return true;
  }

  /**
   * Computes the set of tiles a unit can move to using BFS.
   */
  getMovementRange(unitId: string): Set<string> {
    const unit = this.units.get(unitId);
    if (unit === undefined) return new Set();

    const reachable = new Set<string>();
    const visited = new Map<string, number>();
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

        let newRemaining: number;

        if (this.isWaterTile(neighbor.x, neighbor.y)) {
          continue;
        }

        if (cost >= IMPASSABLE_COST) {
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
          continue;
        }

        visited.set(nKey, newRemaining);

        const occupant = this.getUnitAt(neighbor.x, neighbor.y);

        if (occupant === undefined) {
          reachable.add(nKey);
        }
        if (occupant !== undefined && occupant.owner !== unit.owner) {
          continue;
        }

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
  // Win Condition
  // ---------------------------------------------------------------------------

  private checkWinCondition(): void {
    if (this.config.winCondition !== 'domination') return;
    if (this.winner >= 0) return;

    // Domination: a player wins when all other players have lost all cities and units
    for (let p = 0; p < this.playerCount; p++) {
      const tribe = this.config.tribes[p];
      const hasCities = this.cities.some(c => c.owner === tribe);
      const hasUnits = this.getUnitsForPlayer(p).length > 0;
      if (hasCities || hasUnits) continue;
      // Player p is eliminated — but that doesn't mean someone won yet
    }

    // Check if only one player remains with cities or units
    let remainingPlayers = 0;
    let lastPlayer = -1;
    for (let p = 0; p < this.playerCount; p++) {
      const tribe = this.config.tribes[p];
      const hasCities = this.cities.some(c => c.owner === tribe);
      const hasUnits = this.getUnitsForPlayer(p).length > 0;
      if (hasCities || hasUnits) {
        remainingPlayers++;
        lastPlayer = p;
      }
    }

    if (remainingPlayers === 1) {
      this.winner = lastPlayer;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Get the player index for a tribe ID. Returns -1 if not found. */
  getPlayerForTribe(tribeId: TribeId): number {
    return this.config.tribes.indexOf(tribeId);
  }

  private isWaterTile(x: number, y: number): boolean {
    const tile = this.map.getTile(x, y);
    if (tile === null) return false;
    return tile.type === TileType.ShallowWater || tile.type === TileType.Ocean;
  }
}
