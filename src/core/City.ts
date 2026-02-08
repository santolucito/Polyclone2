/**
 * City management for PolyClone2.
 * Pure TypeScript — no browser or rendering dependencies.
 *
 * Manages city creation, population growth, leveling, rewards,
 * territory calculation, and star income.
 */

import { CityInstance, CityLevelReward, CityLevelRewardOption, Coord, TribeId, UnitType } from './types.js';

/** Population required to reach a given level (index = level). */
const POP_THRESHOLDS: readonly number[] = [
  0, // Level 0 (unused)
  0, // Level 1: starts at 0 pop
  2, // Level 2: need 2 pop
  3, // Level 3: need 3 more (5 cumulative)
  4, // Level 4: need 4 more (9 cumulative)
  5, // Level 5: need 5 more (14 cumulative)
];

/**
 * Get the population threshold to reach the next level.
 * For levels beyond 5, the pattern continues: level N requires N pop.
 */
export function getPopToNextLevel(currentLevel: number): number {
  if (currentLevel < 1) return 0;
  if (currentLevel < POP_THRESHOLDS.length) {
    return POP_THRESHOLDS[currentLevel + 1] ?? currentLevel + 1;
  }
  return currentLevel + 1;
}

/**
 * Get the cumulative population needed to reach a specific level.
 */
export function getCumulativePopForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += getPopToNextLevel(l);
  }
  return total;
}

/**
 * Get the number of units a city can support at a given level.
 * Level 1 = 2 units, each level adds 1.
 */
export function getUnitCapacity(level: number): number {
  return level + 1;
}

/**
 * Get the level-up reward options for a given level.
 */
export function getLevelRewards(level: number): CityLevelReward {
  switch (level) {
    case 2:
      return {
        level: 2,
        optionA: { kind: 'workshop', description: '+1 SPT' },
        optionB: { kind: 'explorer', description: 'Reveals surrounding map' },
      };
    case 3:
      return {
        level: 3,
        optionA: { kind: 'cityWall', description: '4x defense bonus' },
        optionB: { kind: 'stars', amount: 5, description: 'Immediate stars' },
      };
    case 4:
      return {
        level: 4,
        optionA: { kind: 'borderGrowth', description: '3x3 -> 5x5 territory' },
        optionB: { kind: 'population', amount: 3, description: '+3 population' },
      };
    default:
      // Level 5+
      return {
        level,
        optionA: { kind: 'park', description: '+1 SPT, +250 pts' },
        optionB: { kind: 'superUnit', unitType: UnitType.Giant, description: 'Spawn Giant' },
      };
  }
}

/**
 * Create a new city instance.
 */
export function createCity(
  owner: TribeId,
  position: Coord,
  name: string,
  isCapital: boolean,
): CityInstance {
  return {
    owner,
    position,
    name,
    level: 1,
    population: 0,
    isCapital,
    hasWall: false,
    hasWorkshop: false,
    hasPark: false,
    borderSize: 3,
  };
}

/**
 * Add population to a city. Returns the updated city.
 * Does NOT automatically level up — call checkLevelUp() after.
 */
export function addPopulation(city: CityInstance, amount: number): CityInstance {
  return {
    ...city,
    population: city.population + amount,
  };
}

/**
 * Check if a city is ready to level up.
 */
export function canLevelUp(city: CityInstance): boolean {
  const needed = getPopToNextLevel(city.level);
  return city.population >= needed;
}

/**
 * Level up a city and apply the chosen reward.
 * Returns the updated city, or the same city if not eligible.
 */
export function levelUp(city: CityInstance, chosenReward: CityLevelRewardOption): CityInstance {
  if (!canLevelUp(city)) return city;

  const needed = getPopToNextLevel(city.level);
  const newLevel = city.level + 1;
  const remainingPop = city.population - needed;

  let updated: CityInstance = {
    ...city,
    level: newLevel,
    population: remainingPop,
  };

  // Apply the chosen reward
  switch (chosenReward.kind) {
    case 'workshop':
      updated = { ...updated, hasWorkshop: true };
      break;
    case 'cityWall':
      updated = { ...updated, hasWall: true };
      break;
    case 'borderGrowth':
      updated = { ...updated, borderSize: 5 };
      break;
    case 'park':
      updated = { ...updated, hasPark: true };
      break;
    case 'population':
      updated = { ...updated, population: updated.population + chosenReward.amount };
      break;
    // 'explorer', 'stars', 'superUnit' are handled externally
    // (they affect game state, not the city itself)
  }

  return updated;
}

/**
 * Calculate the star income (SPT) for a city.
 * Base: 1 SPT per level
 * Capital bonus: +1 SPT
 * Workshop: +1 SPT
 * Park: +1 SPT
 */
export function calculateCityIncome(city: CityInstance): number {
  let income = city.level;
  if (city.isCapital) income += 1;
  if (city.hasWorkshop) income += 1;
  if (city.hasPark) income += 1;
  return income;
}

/**
 * Get the territory tiles for a city based on its border size.
 * Returns all grid coordinates within the city's border area.
 * Border size 3 = 3x3 area centered on city, border size 5 = 5x5 area.
 */
export function getCityTerritory(city: CityInstance): Coord[] {
  const half = Math.floor(city.borderSize / 2);
  const tiles: Coord[] = [];

  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      tiles.push({
        x: city.position.x + dx,
        y: city.position.y + dy,
      });
    }
  }

  return tiles;
}

/**
 * Transfer city ownership (capture).
 * Resets wall and workshop but keeps level and population.
 */
export function captureCity(city: CityInstance, newOwner: TribeId): CityInstance {
  return {
    ...city,
    owner: newOwner,
    isCapital: false,
    hasWall: false,
    hasWorkshop: false,
    hasPark: false,
  };
}
