/**
 * Core type definitions for PolyClone2 game model.
 * Pure TypeScript -- no browser or rendering dependencies.
 *
 * All values derived from:
 *   /docs/design/game-mechanics.md
 *   /docs/design/tribes.md
 */

// ---------------------------------------------------------------------------
// Terrain & Map
// ---------------------------------------------------------------------------

/** Terrain types present on the game map. */
export enum TileType {
  Field = 'field',
  Forest = 'forest',
  Mountain = 'mountain',
  ShallowWater = 'shallowWater',
  Ocean = 'ocean',
}

/** A discrete (x, y) coordinate on the game map grid. */
export interface Coord {
  readonly x: number;
  readonly y: number;
}

/** Resources that can spawn on map tiles. */
export enum ResourceType {
  Fruit = 'fruit',
  Animal = 'animal',
  Fish = 'fish',
  Crop = 'crop',
  Metal = 'metal',
  Starfish = 'starfish',
}

/** A single tile on the game map. */
export interface Tile {
  readonly type: TileType;
  readonly x: number;
  readonly y: number;
  readonly resource?: ResourceType;
  readonly building?: BuildingType;
  readonly unit?: UnitInstance;
  readonly owner?: TribeId;
}

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

/** All unit types: 10 standard land + 4 naval. */
export enum UnitType {
  // Standard land units (10)
  Warrior = 'warrior',
  Archer = 'archer',
  Defender = 'defender',
  Rider = 'rider',
  Swordsman = 'swordsman',
  MindBender = 'mindBender',
  Catapult = 'catapult',
  Knight = 'knight',
  Cloak = 'cloak',
  Giant = 'giant',
  // Naval units (4)
  Raft = 'raft',
  Scout = 'scout',
  Rammer = 'rammer',
  Bomber = 'bomber',
}

/** Skills that units can possess. */
export enum UnitSkill {
  // Movement
  Dash = 'dash',
  Escape = 'escape',
  Persist = 'persist',
  Creep = 'creep',
  Air = 'air',
  // Combat
  Fortify = 'fortify',
  Stiff = 'stiff',
  Splash = 'splash',
  Convert = 'convert',
  // Utility
  Heal = 'heal',
  Hide = 'hide',
  Infiltrate = 'infiltrate',
  Scout = 'scout',
  Carry = 'carry',
  Static = 'static',
  Water = 'water',
}

/** Base stats for a unit type (from data/units.json). */
export interface UnitStats {
  readonly cost: number | null;       // Stars to train; null = not trainable (Giant, naval upgrades)
  readonly hp: number | null;         // Max HP; null = uses carried unit's HP (naval)
  readonly atk: number;
  readonly def: number;
  readonly movement: number;
  readonly range: number;
  readonly skills: readonly UnitSkill[];
}

/** Static definition of a unit type, loaded from JSON. */
export interface UnitDefinition {
  readonly type: UnitType;
  readonly name: string;
  readonly stats: UnitStats;
  readonly tech: TechId | 'starting' | 'cityReward';
  readonly isNaval: boolean;
}

/** A live unit instance on the board. */
export interface UnitInstance {
  readonly id: string;
  readonly type: UnitType;
  readonly owner: number;  // player index (0, 1, ...)
  readonly x: number;
  readonly y: number;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly atk: number;
  readonly def: number;
  readonly movement: number;
  readonly range: number;
  readonly kills: number;
  readonly isVeteran: boolean;
  readonly hasMoved: boolean;
  readonly hasAttacked: boolean;
  readonly isHidden: boolean;
  readonly skills: readonly UnitSkill[];
  readonly carriedUnit?: UnitInstance;  // Land unit inside a naval Carry unit
}

// ---------------------------------------------------------------------------
// Technology
// ---------------------------------------------------------------------------

/** All 25 technologies in the tech tree. */
export type TechId =
  // Tier 1 (5 root techs)
  | 'climbing'
  | 'hunting'
  | 'organization'
  | 'riding'
  | 'fishing'
  // Tier 2 (10 techs)
  | 'mining'
  | 'meditation'
  | 'archery'
  | 'forestry'
  | 'farming'
  | 'strategy'
  | 'roads'
  | 'freeSpirit'
  | 'sailing'
  | 'ramming'
  // Tier 3 (10 techs)
  | 'smithery'
  | 'philosophy'
  | 'spiritualism'
  | 'mathematics'
  | 'construction'
  | 'diplomacy'
  | 'trade'
  | 'chivalry'
  | 'navigation'
  | 'aquatism';

export type TechTier = 1 | 2 | 3;

/** A single thing unlocked by researching a technology. */
export type TechUnlock =
  | { readonly kind: 'unit'; readonly unitType: UnitType }
  | { readonly kind: 'building'; readonly buildingType: BuildingType }
  | { readonly kind: 'action'; readonly action: string }
  | { readonly kind: 'ability'; readonly ability: string }
  | { readonly kind: 'resource'; readonly resourceType: ResourceType };

/** Static definition of a technology, loaded from JSON. */
export interface TechDefinition {
  readonly id: TechId;
  readonly name: string;
  readonly tier: TechTier;
  readonly prerequisite: TechId | null;
  readonly unlocks: readonly TechUnlock[];
}

// ---------------------------------------------------------------------------
// Tribes
// ---------------------------------------------------------------------------

/** The 4 starter tribes plus 'neutral' for unclaimed villages. */
export type TribeId = 'xinxi' | 'imperius' | 'bardur' | 'oumaji' | 'neutral';

/** Multipliers applied to base terrain/resource spawn rates. */
export interface TerrainModifiers {
  readonly forest: number;
  readonly mountain: number;
  readonly fruit: number;
  readonly crop: number;
  readonly animal: number;
  readonly metal: number;
  readonly fish: number;
}

/** Static definition of a tribe, loaded from JSON. */
export interface TribeDefinition {
  readonly id: TribeId;
  readonly name: string;
  readonly color: string;
  readonly startingTech: TechId;
  readonly startingUnit: UnitType;
  readonly terrainModifiers: TerrainModifiers;
}

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

/** All building types that can be placed on the map. */
export enum BuildingType {
  Farm = 'farm',
  Mine = 'mine',
  LumberHut = 'lumberHut',
  Sawmill = 'sawmill',
  Windmill = 'windmill',
  Forge = 'forge',
  Market = 'market',
  Port = 'port',
  Road = 'road',
  Bridge = 'bridge',
  Temple = 'temple',
  ForestTemple = 'forestTemple',
  MountainTemple = 'mountainTemple',
  WaterTemple = 'waterTemple',
  Monument = 'monument',
}

/** Describes where a building can be placed. */
export type PlacementRule =
  | { readonly on: TileType; readonly requiresResource?: ResourceType }
  | { readonly on: 'coastal' }
  | { readonly on: 'any' };

/** Static definition of a building, loaded from JSON. */
export interface BuildingDefinition {
  readonly type: BuildingType;
  readonly name: string;
  readonly cost: number;
  readonly population: number | string;  // Fixed number or formula, e.g. "+1/adj lumberHut"
  readonly placement: PlacementRule;
  readonly tech: TechId;
}

// ---------------------------------------------------------------------------
// City System
// ---------------------------------------------------------------------------

/** Level-up reward alternatives. */
export interface CityLevelReward {
  readonly level: number;
  readonly optionA: CityLevelRewardOption;
  readonly optionB: CityLevelRewardOption;
}

export type CityLevelRewardOption =
  | { readonly kind: 'workshop'; readonly description: '+1 SPT' }
  | { readonly kind: 'explorer'; readonly description: 'Reveals surrounding map' }
  | { readonly kind: 'cityWall'; readonly description: '4x defense bonus' }
  | { readonly kind: 'stars'; readonly amount: number; readonly description: 'Immediate stars' }
  | { readonly kind: 'borderGrowth'; readonly description: '3x3 -> 5x5 territory' }
  | { readonly kind: 'population'; readonly amount: number; readonly description: '+3 population' }
  | { readonly kind: 'park'; readonly description: '+1 SPT, +250 pts' }
  | { readonly kind: 'superUnit'; readonly unitType: UnitType; readonly description: 'Spawn Giant' };

/** A live city instance on the board. */
export interface CityInstance {
  readonly owner: TribeId;
  readonly position: Coord;
  readonly name: string;
  readonly level: number;
  readonly population: number;
  readonly isCapital: boolean;
  readonly hasWall: boolean;
  readonly hasWorkshop: boolean;
  readonly hasPark: boolean;
  readonly borderSize: 3 | 5;
}

// ---------------------------------------------------------------------------
// Defense Bonuses
// ---------------------------------------------------------------------------

export interface DefenseBonus {
  readonly terrain: TileType | 'city' | 'cityWall';
  readonly multiplier: number;
}

/** All defense bonuses from the design doc. */
export const DEFENSE_BONUSES: readonly DefenseBonus[] = [
  { terrain: TileType.Field, multiplier: 1.0 },
  { terrain: TileType.Forest, multiplier: 1.5 },
  { terrain: TileType.Mountain, multiplier: 1.5 },
  { terrain: TileType.ShallowWater, multiplier: 1.5 },
  { terrain: TileType.Ocean, multiplier: 1.5 },
  { terrain: 'city', multiplier: 1.5 },
  { terrain: 'cityWall', multiplier: 4.0 },
] as const;

// ---------------------------------------------------------------------------
// Monuments
// ---------------------------------------------------------------------------

export type MonumentId =
  | 'grandBazaar'
  | 'emperorsTomb'
  | 'towerOfWisdom'
  | 'gateOfPower'
  | 'altarOfPeace'
  | 'parkOfFortune'
  | 'eyeOfGod';

export interface MonumentDefinition {
  readonly id: MonumentId;
  readonly name: string;
  readonly taskDescription: string;
  readonly population: number;
  readonly points: number;
}

// ---------------------------------------------------------------------------
// Game Configuration
// ---------------------------------------------------------------------------

export type Difficulty = 'easy' | 'normal' | 'hard' | 'crazy';
export type WinCondition = 'perfection' | 'domination';

export interface GameConfig {
  readonly mapSize: number;
  readonly waterLevel: number;         // 0.0 - 1.0
  readonly tribes: readonly TribeId[];
  readonly difficulty: Difficulty;
  readonly winCondition: WinCondition;
  readonly turnLimit: number | null;   // null = no limit (domination)
}
