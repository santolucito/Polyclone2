import { describe, it, expect } from 'vitest';
import {
  getTechDefinition,
  getAllTechs,
  PlayerTechState,
  calculateTechCost,
} from '../../src/core/TechTree.js';
import { TechId, UnitType, BuildingType } from '../../src/core/types.js';

describe('TechTree', () => {
  describe('getTechDefinition', () => {
    it('should return definition for a valid tech', () => {
      const def = getTechDefinition('climbing');
      expect(def.id).toBe('climbing');
      expect(def.name).toBe('Climbing');
      expect(def.tier).toBe(1);
      expect(def.prerequisite).toBeNull();
    });

    it('should return correct prerequisites for tier 2 techs', () => {
      expect(getTechDefinition('mining').prerequisite).toBe('climbing');
      expect(getTechDefinition('archery').prerequisite).toBe('hunting');
      expect(getTechDefinition('farming').prerequisite).toBe('organization');
      expect(getTechDefinition('roads').prerequisite).toBe('riding');
      expect(getTechDefinition('sailing').prerequisite).toBe('fishing');
    });

    it('should return correct prerequisites for tier 3 techs', () => {
      expect(getTechDefinition('smithery').prerequisite).toBe('mining');
      expect(getTechDefinition('philosophy').prerequisite).toBe('meditation');
      expect(getTechDefinition('chivalry').prerequisite).toBe('freeSpirit');
      expect(getTechDefinition('navigation').prerequisite).toBe('sailing');
    });

    it('should throw for unknown tech', () => {
      expect(() => getTechDefinition('bogus' as TechId)).toThrow('Unknown tech');
    });
  });

  describe('getAllTechs', () => {
    it('should return all 25 techs', () => {
      const techs = getAllTechs();
      expect(techs).toHaveLength(25);
    });

    it('should have 5 tier-1 techs', () => {
      const tier1 = getAllTechs().filter(t => t.tier === 1);
      expect(tier1).toHaveLength(5);
    });

    it('should have 10 tier-2 techs', () => {
      const tier2 = getAllTechs().filter(t => t.tier === 2);
      expect(tier2).toHaveLength(10);
    });

    it('should have 10 tier-3 techs', () => {
      const tier3 = getAllTechs().filter(t => t.tier === 3);
      expect(tier3).toHaveLength(10);
    });
  });

  describe('PlayerTechState', () => {
    it('should initialize with starting techs', () => {
      const state = new PlayerTechState(['climbing']);
      expect(state.hasResearched('climbing')).toBe(true);
      expect(state.hasResearched('hunting')).toBe(false);
    });

    it('should initialize empty when no starting techs', () => {
      const state = new PlayerTechState();
      expect(state.getResearchedCount()).toBe(0);
    });

    describe('canResearch', () => {
      it('should allow tier 1 techs with no prerequisites', () => {
        const state = new PlayerTechState();
        expect(state.canResearch('climbing')).toBe(true);
        expect(state.canResearch('hunting')).toBe(true);
        expect(state.canResearch('organization')).toBe(true);
        expect(state.canResearch('riding')).toBe(true);
        expect(state.canResearch('fishing')).toBe(true);
      });

      it('should not allow tier 2 tech without prerequisite', () => {
        const state = new PlayerTechState();
        expect(state.canResearch('mining')).toBe(false);
        expect(state.canResearch('archery')).toBe(false);
      });

      it('should allow tier 2 tech with prerequisite', () => {
        const state = new PlayerTechState(['climbing']);
        expect(state.canResearch('mining')).toBe(true);
        expect(state.canResearch('meditation')).toBe(true);
      });

      it('should not allow tier 3 tech with only tier 1 prereq', () => {
        const state = new PlayerTechState(['climbing']);
        expect(state.canResearch('smithery')).toBe(false);
      });

      it('should allow tier 3 tech with full prerequisite chain', () => {
        const state = new PlayerTechState(['climbing']);
        state.research('mining');
        expect(state.canResearch('smithery')).toBe(true);
      });

      it('should not allow already-researched tech', () => {
        const state = new PlayerTechState(['climbing']);
        expect(state.canResearch('climbing')).toBe(false);
      });
    });

    describe('research', () => {
      it('should successfully research a valid tech', () => {
        const state = new PlayerTechState();
        const result = state.research('climbing');
        expect(result).toBe(true);
        expect(state.hasResearched('climbing')).toBe(true);
      });

      it('should fail for tech without prerequisite', () => {
        const state = new PlayerTechState();
        const result = state.research('mining');
        expect(result).toBe(false);
        expect(state.hasResearched('mining')).toBe(false);
      });

      it('should fail for already researched tech', () => {
        const state = new PlayerTechState(['climbing']);
        const result = state.research('climbing');
        expect(result).toBe(false);
      });
    });

    describe('getAvailableTechs', () => {
      it('should return all tier 1 techs for empty state', () => {
        const state = new PlayerTechState();
        const available = state.getAvailableTechs();
        expect(available).toContain('climbing');
        expect(available).toContain('hunting');
        expect(available).toContain('organization');
        expect(available).toContain('riding');
        expect(available).toContain('fishing');
        expect(available).toHaveLength(5);
      });

      it('should include tier 2 children after researching tier 1', () => {
        const state = new PlayerTechState(['climbing']);
        const available = state.getAvailableTechs();
        expect(available).toContain('mining');
        expect(available).toContain('meditation');
        // Should not include climbing (already researched)
        expect(available).not.toContain('climbing');
        // Other tier 1 techs should still be available
        expect(available).toContain('hunting');
      });
    });

    describe('isUnitUnlocked', () => {
      it('should return true when unit tech is researched', () => {
        const state = new PlayerTechState(['riding']);
        expect(state.isUnitUnlocked('rider' as UnitType)).toBe(true);
      });

      it('should return false when unit tech is not researched', () => {
        const state = new PlayerTechState();
        expect(state.isUnitUnlocked('rider' as UnitType)).toBe(false);
      });

      it('should unlock swordsman with smithery', () => {
        const state = new PlayerTechState(['climbing']);
        state.research('mining');
        state.research('smithery');
        expect(state.isUnitUnlocked('swordsman' as UnitType)).toBe(true);
      });
    });

    describe('isBuildingUnlocked', () => {
      it('should return true when building tech is researched', () => {
        const state = new PlayerTechState(['climbing']);
        state.research('mining');
        expect(state.isBuildingUnlocked('mine' as BuildingType)).toBe(true);
      });

      it('should return false when building tech is not researched', () => {
        const state = new PlayerTechState();
        expect(state.isBuildingUnlocked('mine' as BuildingType)).toBe(false);
      });
    });

    describe('hasLiteracy', () => {
      it('should return false without philosophy', () => {
        const state = new PlayerTechState();
        expect(state.hasLiteracy()).toBe(false);
      });

      it('should return true with philosophy', () => {
        const state = new PlayerTechState(['climbing']);
        state.research('meditation');
        state.research('philosophy');
        expect(state.hasLiteracy()).toBe(true);
      });
    });

    describe('getAllUnlocks', () => {
      it('should return unlocks from all researched techs', () => {
        const state = new PlayerTechState(['climbing', 'riding']);
        const unlocks = state.getAllUnlocks();
        // Climbing has 3 unlocks, Riding has 1 unlock
        expect(unlocks.length).toBe(4);
      });
    });
  });

  describe('calculateTechCost', () => {
    it('should follow formula: tier * cities + 4', () => {
      // Tier 1, 1 city: 1*1 + 4 = 5
      expect(calculateTechCost('climbing', 1, false)).toBe(5);
      // Tier 2, 1 city: 2*1 + 4 = 6
      expect(calculateTechCost('mining', 1, false)).toBe(6);
      // Tier 3, 1 city: 3*1 + 4 = 7
      expect(calculateTechCost('smithery', 1, false)).toBe(7);
    });

    it('should scale with number of cities', () => {
      // Tier 1, 2 cities: 1*2 + 4 = 6
      expect(calculateTechCost('climbing', 2, false)).toBe(6);
      // Tier 2, 3 cities: 2*3 + 4 = 10
      expect(calculateTechCost('mining', 3, false)).toBe(10);
      // Tier 3, 5 cities: 3*5 + 4 = 19
      expect(calculateTechCost('smithery', 5, false)).toBe(19);
    });

    it('should match the design doc cost table', () => {
      // From game-mechanics.md table:
      // 1 city: T1=5, T2=6, T3=7
      expect(calculateTechCost('climbing', 1, false)).toBe(5);
      expect(calculateTechCost('mining', 1, false)).toBe(6);
      expect(calculateTechCost('smithery', 1, false)).toBe(7);

      // 2 cities: T1=6, T2=8, T3=10
      expect(calculateTechCost('climbing', 2, false)).toBe(6);
      expect(calculateTechCost('mining', 2, false)).toBe(8);
      expect(calculateTechCost('smithery', 2, false)).toBe(10);

      // 3 cities: T1=7, T2=10, T3=13
      expect(calculateTechCost('climbing', 3, false)).toBe(7);
      expect(calculateTechCost('mining', 3, false)).toBe(10);
      expect(calculateTechCost('smithery', 3, false)).toBe(13);

      // 5 cities: T1=9, T2=14, T3=19
      expect(calculateTechCost('climbing', 5, false)).toBe(9);
      expect(calculateTechCost('mining', 5, false)).toBe(14);
      expect(calculateTechCost('smithery', 5, false)).toBe(19);

      // 10 cities: T1=14, T2=24, T3=34
      expect(calculateTechCost('climbing', 10, false)).toBe(14);
      expect(calculateTechCost('mining', 10, false)).toBe(24);
      expect(calculateTechCost('smithery', 10, false)).toBe(34);
    });

    it('should apply Literacy discount (33% reduction, rounded up)', () => {
      // Tier 1, 1 city: base=5, with literacy: ceil(5 * 2/3) = ceil(3.33) = 4
      expect(calculateTechCost('climbing', 1, true)).toBe(4);
      // Tier 2, 1 city: base=6, with literacy: ceil(6 * 2/3) = ceil(4.0) = 4
      expect(calculateTechCost('mining', 1, true)).toBe(4);
      // Tier 3, 5 cities: base=19, with literacy: ceil(19 * 2/3) = ceil(12.67) = 13
      expect(calculateTechCost('smithery', 5, true)).toBe(13);
    });
  });
});
