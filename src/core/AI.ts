/**
 * Rule-based AI opponent for PolyClone2.
 * Pure TypeScript -- no browser or rendering dependencies.
 *
 * Executes a full turn for the current AI player:
 *   1. Research the cheapest affordable tech
 *   2. Train the strongest affordable unit at each city
 *   3. Move each unit toward the nearest enemy
 *   4. Attack any adjacent enemies
 */

import { GameState } from './GameState.js';
import { UnitType } from './types.js';
import { getUnitBaseStats } from './UnitFactory.js';

/**
 * Unit training priority: strongest first.
 * The AI tries each type in order, picking the first one it can afford and has unlocked.
 */
const TRAIN_PRIORITY: readonly UnitType[] = [
  UnitType.Swordsman,
  UnitType.Knight,
  UnitType.Rider,
  UnitType.Archer,
  UnitType.Defender,
  UnitType.Warrior,
];

/**
 * Execute a complete AI turn for the current player.
 * Performs research, training, movement, and attacks in sequence.
 */
export function executeAITurn(gameState: GameState): void {
  const player = gameState.getCurrentPlayer();

  // Phase 1: Research
  aiResearch(gameState, player);

  // Phase 2: Train units at cities
  aiTrain(gameState, player);

  // Phase 3: Move units toward enemies
  aiMove(gameState, player);

  // Phase 4: Attack adjacent enemies
  aiAttack(gameState, player);
}

/**
 * Phase 1: Research the cheapest available tech the AI can afford.
 */
function aiResearch(gameState: GameState, player: number): void {
  const techState = gameState.getTechState(player);
  const availableTechs = techState.getAvailableTechs();

  if (availableTechs.length === 0) return;

  // Sort by cost ascending
  const sorted = availableTechs
    .map(techId => ({ techId, cost: gameState.getTechCost(player, techId) }))
    .sort((a, b) => a.cost - b.cost);

  // Pick the first affordable tech
  for (const { techId, cost } of sorted) {
    if (gameState.getStars(player) >= cost) {
      gameState.researchTech(player, techId);
      return;
    }
  }
}

/**
 * Phase 2: At each owned city, train the strongest affordable unit.
 */
function aiTrain(gameState: GameState, player: number): void {
  const tribeId = gameState.getTribeForPlayer(player);
  const cities = gameState.getAllCities().filter(c => c.owner === tribeId);
  const techState = gameState.getTechState(player);

  for (const city of cities) {
    const { x, y } = city.position;

    // Skip if tile is occupied
    if (gameState.getUnitAt(x, y) !== undefined) continue;

    // Try each unit type in priority order
    for (const unitType of TRAIN_PRIORITY) {
      // Check tech unlock (warriors are always available)
      if (unitType !== UnitType.Warrior && !techState.isUnitUnlocked(unitType)) {
        continue;
      }

      // Check affordability
      const stats = getUnitBaseStats(unitType);
      if (stats.cost === null) continue;
      if (gameState.getStars(player) < stats.cost) continue;

      // Train the unit
      const trained = gameState.trainUnit(x, y, unitType);
      if (trained) break;
    }
  }
}

/**
 * Phase 3: Move each AI unit toward the nearest enemy.
 */
function aiMove(gameState: GameState, player: number): void {
  const aiUnits = gameState.getUnitsForPlayer(player);
  const enemies = gameState.getAllUnits().filter(u => u.owner !== player);

  if (enemies.length === 0) return;

  for (const unit of aiUnits) {
    if (unit.hasMoved) continue;

    // Find nearest enemy by Manhattan distance
    let nearestEnemy = enemies[0];
    let nearestDist = manhattan(unit.x, unit.y, enemies[0].x, enemies[0].y);

    for (let i = 1; i < enemies.length; i++) {
      const dist = manhattan(unit.x, unit.y, enemies[i].x, enemies[i].y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemies[i];
      }
    }

    // Get reachable tiles
    const reachable = gameState.getMovementRange(unit.id);
    if (reachable.size === 0) continue;

    // Pick the reachable tile closest to the target enemy
    let bestKey: string | null = null;
    let bestDist = Infinity;

    for (const key of reachable) {
      const coord = GameState.parseCoordKey(key);
      const dist = manhattan(coord.x, coord.y, nearestEnemy.x, nearestEnemy.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestKey = key;
      }
    }

    if (bestKey !== null) {
      // Only move if it actually gets us closer (or at least as close)
      const coord = GameState.parseCoordKey(bestKey);
      gameState.moveUnit(unit.id, coord.x, coord.y);
    }
  }
}

/**
 * Phase 4: For each AI unit, attack any enemy within range.
 */
function aiAttack(gameState: GameState, player: number): void {
  // Re-fetch units since positions may have changed after movement
  const aiUnits = gameState.getUnitsForPlayer(player);

  for (const unit of aiUnits) {
    if (unit.hasAttacked) continue;

    // Re-read the unit in case it was updated
    const current = gameState.getUnit(unit.id);
    if (!current) continue;

    // Find enemies within attack range
    const allEnemies = gameState.getAllUnits().filter(u => u.owner !== player);

    for (const enemy of allEnemies) {
      const dist = Math.max(
        Math.abs(current.x - enemy.x),
        Math.abs(current.y - enemy.y),
      );
      if (dist <= current.range) {
        gameState.attackUnit(current.id, enemy.x, enemy.y);
        break; // Only one attack per unit
      }
    }
  }
}

/**
 * Manhattan distance between two grid positions.
 */
function manhattan(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}
