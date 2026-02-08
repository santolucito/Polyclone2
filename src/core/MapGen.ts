/**
 * Procedural map generation for PolyClone2.
 * Pure TypeScript — no browser or rendering dependencies.
 *
 * Generates maps with terrain, resources, and capital placements
 * based on the Polytopia map generation rules.
 */

import { Coord, GameConfig, TerrainModifiers, TileType, TribeId } from './types.js';
import { GameMap } from './GameMap.js';

/** Seeded pseudo-random number generator (simple LCG). */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /** Returns a value in [0, 1). */
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  /** Returns an integer in [min, max). */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /** Shuffle an array in place (Fisher-Yates). */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/** Terrain modifiers for each tribe. Neutral has no modifiers. */
const TRIBE_MODIFIERS: Partial<Record<TribeId, TerrainModifiers>> = {
  xinxi:    { forest: 1.0, mountain: 1.5, fruit: 1.0, crop: 1.0, animal: 1.0, metal: 1.5, fish: 1.0 },
  imperius: { forest: 1.0, mountain: 1.0, fruit: 2.0, crop: 1.0, animal: 0.5, metal: 1.0, fish: 1.0 },
  bardur:   { forest: 0.8, mountain: 1.0, fruit: 1.5, crop: 0.0, animal: 1.0, metal: 1.0, fish: 1.0 },
  oumaji:   { forest: 0.2, mountain: 0.5, fruit: 1.0, crop: 1.0, animal: 0.2, metal: 1.0, fish: 1.0 },
};

/** Base terrain distribution rates. */
const BASE_RATES = {
  field: 0.48,
  forest: 0.38,
  mountain: 0.14,
};

/** Map size presets. */
export type MapSizePreset = 'tiny' | 'small' | 'normal' | 'large';

const MAP_SIZES: Record<MapSizePreset, number> = {
  tiny: 11,
  small: 14,
  normal: 16,
  large: 18,
};

/** Get the map size for a preset. */
export function getMapSize(preset: MapSizePreset): number {
  return MAP_SIZES[preset];
}

/** Result of map generation, including the map and capital positions. */
export interface GeneratedMapResult {
  readonly map: GameMap;
  readonly capitals: readonly Coord[];
  readonly villages: readonly Coord[];
}

/**
 * Place capitals in separate quadrants of the map.
 * For 1-4 players, divides map into 2x2 grid.
 */
export function placeCapitals(
  mapSize: number,
  playerCount: number,
  rng: SeededRandom,
): Coord[] {
  const half = Math.floor(mapSize / 2);
  const margin = 2; // Keep away from edges

  // 2x2 quadrant centers
  const quadrants: Coord[] = [
    { x: margin + rng.nextInt(0, half - margin * 2), y: margin + rng.nextInt(0, half - margin * 2) }, // top-left
    { x: half + rng.nextInt(0, half - margin), y: margin + rng.nextInt(0, half - margin * 2) },        // top-right
    { x: margin + rng.nextInt(0, half - margin * 2), y: half + rng.nextInt(0, half - margin) },        // bottom-left
    { x: half + rng.nextInt(0, half - margin), y: half + rng.nextInt(0, half - margin) },              // bottom-right
  ];

  return quadrants.slice(0, Math.min(playerCount, 4));
}

/**
 * Place villages (neutral cities) on the map.
 * Villages are placed at least 2 tiles apart and 3 tiles from edges.
 */
export function placeVillages(
  mapSize: number,
  capitals: readonly Coord[],
  rng: SeededRandom,
): Coord[] {
  const villages: Coord[] = [];
  const occupied = new Set<string>(capitals.map(c => `${c.x},${c.y}`));
  const edgeMargin = 3;

  // Target village count: approximately (mapSize/3)^2 - capitals
  const targetCount = Math.max(0, Math.floor((mapSize / 3) ** 2) - capitals.length);

  for (let attempt = 0; attempt < targetCount * 10 && villages.length < targetCount; attempt++) {
    const x = rng.nextInt(edgeMargin, mapSize - edgeMargin);
    const y = rng.nextInt(edgeMargin, mapSize - edgeMargin);
    const key = `${x},${y}`;

    if (occupied.has(key)) continue;

    // Check minimum distance from all placed positions
    let tooClose = false;
    for (const pos of [...capitals, ...villages]) {
      const dist = Math.max(Math.abs(x - pos.x), Math.abs(y - pos.y));
      if (dist < 2) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    villages.push({ x, y });
    occupied.add(key);
  }

  return villages;
}

/**
 * Generate water tiles based on the water level.
 * Creates connected water bodies rather than random scattered tiles.
 */
function generateWater(
  map: GameMap,
  waterLevel: number,
  capitals: readonly Coord[],
  rng: SeededRandom,
): void {
  const totalTiles = map.width * map.height;
  const targetWaterTiles = Math.floor(totalTiles * waterLevel);

  if (targetWaterTiles <= 0) return;

  // Start water from random seed points (not too close to capitals)
  const seedCount = Math.max(1, Math.floor(targetWaterTiles / 20));
  const waterSeeds: Coord[] = [];

  for (let i = 0; i < seedCount * 5 && waterSeeds.length < seedCount; i++) {
    const x = rng.nextInt(0, map.width);
    const y = rng.nextInt(0, map.height);

    // Don't place water seed within 3 tiles of a capital
    let nearCapital = false;
    for (const cap of capitals) {
      if (Math.max(Math.abs(x - cap.x), Math.abs(y - cap.y)) <= 3) {
        nearCapital = true;
        break;
      }
    }
    if (nearCapital) continue;
    waterSeeds.push({ x, y });
  }

  // Grow water from seeds using BFS
  const waterSet = new Set<string>();
  const queue = [...waterSeeds];

  for (const seed of waterSeeds) {
    waterSet.add(`${seed.x},${seed.y}`);
  }

  while (waterSet.size < targetWaterTiles && queue.length > 0) {
    const idx = rng.nextInt(0, queue.length);
    const current = queue[idx];
    queue[idx] = queue[queue.length - 1];
    queue.pop();

    // Try to expand to neighbors
    const dirs: number[][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    rng.shuffle(dirs);

    for (const [dx, dy] of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;

      if (!map.isInBounds(nx, ny)) continue;
      if (waterSet.has(key)) continue;

      // Don't place water on capitals
      let isCapital = false;
      for (const cap of capitals) {
        if (cap.x === nx && cap.y === ny) {
          isCapital = true;
          break;
        }
      }
      if (isCapital) continue;

      if (waterSet.size >= targetWaterTiles) break;

      // Random chance to expand (creates organic shapes)
      if (rng.next() < 0.6) {
        waterSet.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  // Place water tiles - determine shallow vs ocean
  for (const key of waterSet) {
    const [x, y] = key.split(',').map(Number);
    map.setTile(x, y, TileType.ShallowWater);
  }

  // Convert interior water to ocean (no land-adjacent edge)
  for (const key of waterSet) {
    const [x, y] = key.split(',').map(Number);
    let touchesLand = false;

    for (let dy = -1; dy <= 1 && !touchesLand; dy++) {
      for (let dx = -1; dx <= 1 && !touchesLand; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (!map.isInBounds(nx, ny)) {
          touchesLand = true;
          continue;
        }
        const neighbor = map.getTile(nx, ny);
        if (neighbor && neighbor.type !== TileType.ShallowWater && neighbor.type !== TileType.Ocean) {
          touchesLand = true;
        }
      }
    }

    if (!touchesLand) {
      map.setTile(x, y, TileType.Ocean);
    }
  }
}

/**
 * Generate terrain (forest, mountain) on land tiles.
 * Uses tribe-specific terrain modifiers to adjust base rates.
 */
function generateTerrain(
  map: GameMap,
  capitals: readonly Coord[],
  tribes: readonly TribeId[],
  rng: SeededRandom,
): void {
  // Average terrain modifiers across all tribes
  const avgMods: TerrainModifiers = averageModifiers(tribes);

  const forestRate = BASE_RATES.forest * avgMods.forest;
  const mountainRate = BASE_RATES.mountain * avgMods.mountain;
  const totalRate = forestRate + mountainRate;
  const normalizedForest = forestRate / (totalRate + BASE_RATES.field);
  const normalizedMountain = mountainRate / (totalRate + BASE_RATES.field);

  const capitalSet = new Set(capitals.map(c => `${c.x},${c.y}`));

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.getTile(x, y);
      if (!tile || tile.type !== TileType.Field) continue;
      if (capitalSet.has(`${x},${y}`)) continue; // Capitals stay as field

      const roll = rng.next();
      if (roll < normalizedForest) {
        map.setTile(x, y, TileType.Forest);
      } else if (roll < normalizedForest + normalizedMountain) {
        map.setTile(x, y, TileType.Mountain);
      }
      // Otherwise stays field
    }
  }

  // Ensure area around capitals (3x3) is mostly field
  for (const cap of capitals) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cap.x + dx;
        const ny = cap.y + dy;
        if (map.isInBounds(nx, ny)) {
          const t = map.getTile(nx, ny);
          if (t && (t.type === TileType.ShallowWater || t.type === TileType.Ocean)) {
            map.setTile(nx, ny, TileType.Field);
          }
        }
      }
    }
  }
}

/** Average terrain modifiers across multiple tribes. */
function averageModifiers(tribes: readonly TribeId[]): TerrainModifiers {
  if (tribes.length === 0) {
    return { forest: 1, mountain: 1, fruit: 1, crop: 1, animal: 1, metal: 1, fish: 1 };
  }

  const sum = { forest: 0, mountain: 0, fruit: 0, crop: 0, animal: 0, metal: 0, fish: 0 };
  for (const tribe of tribes) {
    const mods = TRIBE_MODIFIERS[tribe];
    if (!mods) continue;
    sum.forest += mods.forest;
    sum.mountain += mods.mountain;
    sum.fruit += mods.fruit;
    sum.crop += mods.crop;
    sum.animal += mods.animal;
    sum.metal += mods.metal;
    sum.fish += mods.fish;
  }

  const n = tribes.length;
  return {
    forest: sum.forest / n,
    mountain: sum.mountain / n,
    fruit: sum.fruit / n,
    crop: sum.crop / n,
    animal: sum.animal / n,
    metal: sum.metal / n,
    fish: sum.fish / n,
  };
}

/**
 * Generate the full map from a game config.
 *
 * Steps:
 * 1. Create base map (all field)
 * 2. Place capitals in quadrants
 * 3. Place villages
 * 4. Generate water
 * 5. Generate terrain (forest, mountain)
 */
export function generateMap(config: GameConfig, seed?: number): GeneratedMapResult {
  const rng = new SeededRandom(seed ?? Date.now());
  const mapSize = config.mapSize;
  const map = GameMap.create(mapSize, mapSize, TileType.Field);
  const playerCount = config.tribes.length;

  // 1. Place capitals
  const capitals = placeCapitals(mapSize, playerCount, rng);

  // 2. Place villages
  const villages = placeVillages(mapSize, capitals, rng);

  // 3. Generate water
  generateWater(map, config.waterLevel, capitals, rng);

  // 4. Generate terrain
  generateTerrain(map, capitals, config.tribes, rng);

  return { map, capitals, villages };
}

/**
 * Count tiles of each type in the map.
 * Useful for testing terrain distribution.
 */
export function countTerrain(map: GameMap): Record<TileType, number> {
  const counts: Record<TileType, number> = {
    [TileType.Field]: 0,
    [TileType.Forest]: 0,
    [TileType.Mountain]: 0,
    [TileType.ShallowWater]: 0,
    [TileType.Ocean]: 0,
  };

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.getTile(x, y);
      if (tile) counts[tile.type]++;
    }
  }

  return counts;
}
