/**
 * Technology tree logic for PolyClone2.
 * Pure TypeScript — no browser or rendering dependencies.
 *
 * Manages per-player tech state: which techs are researched,
 * cost calculation, prerequisite validation, and unlock checking.
 */

import { TechId, TechDefinition, TechUnlock, UnitType, BuildingType, ResourceType } from './types.js';

/** Static tech definitions — the full tech tree structure. */
const TECH_TREE: readonly TechDefinition[] = [
  // Tier 1
  { id: 'climbing', name: 'Climbing', tier: 1, prerequisite: null, unlocks: [{ kind: 'ability', ability: 'Mountain movement' }, { kind: 'ability', ability: 'Mountain defense bonus' }, { kind: 'resource', resourceType: 'metal' as ResourceType }] },
  { id: 'hunting', name: 'Hunting', tier: 1, prerequisite: null, unlocks: [{ kind: 'action', action: 'Hunt Animals (+1 pop, 2 stars)' }, { kind: 'resource', resourceType: 'animal' as ResourceType }] },
  { id: 'organization', name: 'Organization', tier: 1, prerequisite: null, unlocks: [{ kind: 'action', action: 'Harvest Fruit (+1 pop, 2 stars)' }, { kind: 'resource', resourceType: 'crop' as ResourceType }] },
  { id: 'riding', name: 'Riding', tier: 1, prerequisite: null, unlocks: [{ kind: 'unit', unitType: 'rider' as UnitType }] },
  { id: 'fishing', name: 'Fishing', tier: 1, prerequisite: null, unlocks: [{ kind: 'action', action: 'Fish (+1 pop, 2 stars)' }, { kind: 'building', buildingType: 'port' as BuildingType }, { kind: 'unit', unitType: 'raft' as UnitType }, { kind: 'ability', ability: 'Shallow water movement' }] },
  // Tier 2
  { id: 'mining', name: 'Mining', tier: 2, prerequisite: 'climbing', unlocks: [{ kind: 'building', buildingType: 'mine' as BuildingType }] },
  { id: 'meditation', name: 'Meditation', tier: 2, prerequisite: 'climbing', unlocks: [{ kind: 'building', buildingType: 'mountainTemple' as BuildingType }] },
  { id: 'archery', name: 'Archery', tier: 2, prerequisite: 'hunting', unlocks: [{ kind: 'unit', unitType: 'archer' as UnitType }, { kind: 'ability', ability: 'Forest defense bonus' }] },
  { id: 'forestry', name: 'Forestry', tier: 2, prerequisite: 'hunting', unlocks: [{ kind: 'building', buildingType: 'lumberHut' as BuildingType }, { kind: 'action', action: 'Clear Forest (+1 star)' }] },
  { id: 'farming', name: 'Farming', tier: 2, prerequisite: 'organization', unlocks: [{ kind: 'building', buildingType: 'farm' as BuildingType }] },
  { id: 'strategy', name: 'Strategy', tier: 2, prerequisite: 'organization', unlocks: [{ kind: 'unit', unitType: 'defender' as UnitType }, { kind: 'ability', ability: 'Peace Treaty' }] },
  { id: 'roads', name: 'Roads', tier: 2, prerequisite: 'riding', unlocks: [{ kind: 'building', buildingType: 'road' as BuildingType }, { kind: 'ability', ability: 'City connections' }] },
  { id: 'freeSpirit', name: 'Free Spirit', tier: 2, prerequisite: 'riding', unlocks: [{ kind: 'building', buildingType: 'temple' as BuildingType }, { kind: 'action', action: 'Disband unit (refund half cost)' }] },
  { id: 'sailing', name: 'Sailing', tier: 2, prerequisite: 'fishing', unlocks: [{ kind: 'unit', unitType: 'scout' as UnitType }, { kind: 'ability', ability: 'Ocean movement' }] },
  { id: 'ramming', name: 'Ramming', tier: 2, prerequisite: 'fishing', unlocks: [{ kind: 'unit', unitType: 'rammer' as UnitType }] },
  // Tier 3
  { id: 'smithery', name: 'Smithery', tier: 3, prerequisite: 'mining', unlocks: [{ kind: 'unit', unitType: 'swordsman' as UnitType }, { kind: 'building', buildingType: 'forge' as BuildingType }] },
  { id: 'philosophy', name: 'Philosophy', tier: 3, prerequisite: 'meditation', unlocks: [{ kind: 'unit', unitType: 'mindBender' as UnitType }, { kind: 'ability', ability: 'Literacy (-33% tech costs)' }] },
  { id: 'spiritualism', name: 'Spiritualism', tier: 3, prerequisite: 'archery', unlocks: [{ kind: 'building', buildingType: 'forestTemple' as BuildingType }, { kind: 'action', action: 'Grow Forest (5 stars, field -> forest)' }] },
  { id: 'mathematics', name: 'Mathematics', tier: 3, prerequisite: 'forestry', unlocks: [{ kind: 'unit', unitType: 'catapult' as UnitType }, { kind: 'building', buildingType: 'sawmill' as BuildingType }] },
  { id: 'construction', name: 'Construction', tier: 3, prerequisite: 'farming', unlocks: [{ kind: 'building', buildingType: 'windmill' as BuildingType }, { kind: 'action', action: 'Burn Forest (5 stars, forest -> field with crop)' }] },
  { id: 'diplomacy', name: 'Diplomacy', tier: 3, prerequisite: 'strategy', unlocks: [{ kind: 'unit', unitType: 'cloak' as UnitType }, { kind: 'ability', ability: 'Embassy (+2 SPT)' }, { kind: 'ability', ability: 'Capital Vision' }] },
  { id: 'trade', name: 'Trade', tier: 3, prerequisite: 'roads', unlocks: [{ kind: 'building', buildingType: 'market' as BuildingType }] },
  { id: 'chivalry', name: 'Chivalry', tier: 3, prerequisite: 'freeSpirit', unlocks: [{ kind: 'unit', unitType: 'knight' as UnitType }] },
  { id: 'navigation', name: 'Navigation', tier: 3, prerequisite: 'sailing', unlocks: [{ kind: 'unit', unitType: 'bomber' as UnitType }, { kind: 'action', action: 'Harvest Starfish (+8 stars)' }] },
  { id: 'aquatism', name: 'Aquatism', tier: 3, prerequisite: 'ramming', unlocks: [{ kind: 'building', buildingType: 'waterTemple' as BuildingType }, { kind: 'ability', ability: 'Ocean defense bonus' }] },
];

/** Lookup map from TechId to TechDefinition. */
const TECH_MAP: ReadonlyMap<TechId, TechDefinition> = new Map(
  TECH_TREE.map(t => [t.id, t]),
);

/**
 * Get the static definition for a technology.
 */
export function getTechDefinition(id: TechId): TechDefinition {
  const def = TECH_MAP.get(id);
  if (!def) throw new Error(`Unknown tech: ${id}`);
  return def;
}

/**
 * Get all tech definitions.
 */
export function getAllTechs(): readonly TechDefinition[] {
  return TECH_TREE;
}

/**
 * Manages per-player technology state.
 */
export class PlayerTechState {
  private readonly researched: Set<TechId> = new Set();

  constructor(startingTechs: readonly TechId[] = []) {
    for (const tech of startingTechs) {
      this.researched.add(tech);
    }
  }

  /** Check if a tech has been researched. */
  hasResearched(id: TechId): boolean {
    return this.researched.has(id);
  }

  /** Get all researched techs. */
  getResearchedTechs(): ReadonlySet<TechId> {
    return this.researched;
  }

  /** Get the count of researched techs. */
  getResearchedCount(): number {
    return this.researched.size;
  }

  /**
   * Check if a tech can be researched (prerequisites met, not already researched).
   */
  canResearch(id: TechId): boolean {
    if (this.researched.has(id)) return false;

    const def = getTechDefinition(id);
    if (def.prerequisite !== null && !this.researched.has(def.prerequisite)) {
      return false;
    }

    return true;
  }

  /**
   * Get all techs currently available for research.
   */
  getAvailableTechs(): TechId[] {
    const available: TechId[] = [];
    for (const tech of TECH_TREE) {
      if (this.canResearch(tech.id)) {
        available.push(tech.id);
      }
    }
    return available;
  }

  /**
   * Research a technology. Returns false if prerequisites not met or already researched.
   */
  research(id: TechId): boolean {
    if (!this.canResearch(id)) return false;
    this.researched.add(id);
    return true;
  }

  /**
   * Check if a specific unit type is unlocked by researched techs.
   */
  isUnitUnlocked(unitType: UnitType): boolean {
    for (const techId of this.researched) {
      const def = getTechDefinition(techId);
      for (const unlock of def.unlocks) {
        if (unlock.kind === 'unit' && unlock.unitType === unitType) return true;
      }
    }
    return false;
  }

  /**
   * Check if a specific building type is unlocked by researched techs.
   */
  isBuildingUnlocked(buildingType: BuildingType): boolean {
    for (const techId of this.researched) {
      const def = getTechDefinition(techId);
      for (const unlock of def.unlocks) {
        if (unlock.kind === 'building' && unlock.buildingType === buildingType) return true;
      }
    }
    return false;
  }

  /**
   * Check if the player has the Literacy ability (from Philosophy).
   */
  hasLiteracy(): boolean {
    return this.researched.has('philosophy');
  }

  /**
   * Get all unlocks from all researched techs.
   */
  getAllUnlocks(): TechUnlock[] {
    const unlocks: TechUnlock[] = [];
    for (const techId of this.researched) {
      const def = getTechDefinition(techId);
      unlocks.push(...def.unlocks);
    }
    return unlocks;
  }
}

/**
 * Calculate the star cost of a technology.
 *
 * Formula: (tier x numCities) + 4
 * With Literacy (Philosophy): ceil(cost x 0.67) -- 33% reduction rounded up
 */
export function calculateTechCost(
  id: TechId,
  numCities: number,
  hasLiteracy: boolean,
): number {
  const def = getTechDefinition(id);
  const baseCost = def.tier * numCities + 4;

  if (hasLiteracy) {
    return Math.ceil(baseCost * (2 / 3));
  }

  return baseCost;
}
