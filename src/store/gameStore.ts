/**
 * Zustand game store for PolyClone2.
 * Reactive state layer wrapping GameState for UI consumption.
 */

import { create } from 'zustand';
import { GameState } from '../core/GameState.js';
import {
  CityInstance,
  CityLevelRewardOption,
  Coord,
  GameConfig,
  TechId,
  UnitInstance,
  UnitType,
} from '../core/types.js';
import { generateMap } from '../core/MapGen.js';
import { createCity } from '../core/City.js';
import { createUnit, resetUnitIdCounter } from '../core/UnitFactory.js';
import { previewCombat, getDefenseBonusForTerrain, getCityDefenseBonus } from '../core/Combat.js';

/** Battle preview data shown in UI. */
export interface BattlePreviewData {
  readonly attacker: UnitInstance;
  readonly defender: UnitInstance;
  readonly damageToDefender: number;
  readonly damageToAttacker: number;
  readonly defenderKilled: boolean;
  readonly attackerKilled: boolean;
}

/** Pending level-up data. */
export interface PendingLevelUp {
  readonly city: CityInstance;
}

/** The game phase: setup screen vs playing. */
export type GamePhase = 'setup' | 'playing';

export interface GameStore {
  // --- Core state ---
  gamePhase: GamePhase;
  gameState: GameState | null;

  // --- Reactive slices (derived from gameState, updated on actions) ---
  stars: number;
  income: number;
  turnNumber: number;
  currentPlayer: number;
  selectedUnitId: string | null;
  selectedUnit: UnitInstance | null;
  selectedCityPos: Coord | null;
  showTechTree: boolean;
  pendingLevelUp: PendingLevelUp | null;
  battlePreview: BattlePreviewData | null;
  movementRange: Set<string> | null;
  winner: number;

  // --- Actions ---
  initGame: (config: GameConfig, seed?: number) => void;
  selectUnit: (unitId: string) => void;
  selectCity: (pos: Coord) => void;
  deselect: () => void;
  endTurn: () => void;
  researchTech: (techId: TechId) => void;
  trainUnit: (unitType: UnitType) => void;
  chooseLevelUpReward: (reward: CityLevelRewardOption) => void;
  attackUnit: (targetX: number, targetY: number) => void;
  showBattlePreview: (targetX: number, targetY: number) => void;
  dismissBattlePreview: () => void;
  toggleTechTree: () => void;
  moveSelectedUnit: (toX: number, toY: number) => boolean;

  // --- Helpers ---
  refreshSlices: () => void;
}

/** Starting unit type per tribe. */
const TRIBE_STARTING_UNIT: Record<string, UnitType> = {
  xinxi: UnitType.Warrior,
  imperius: UnitType.Warrior,
  bardur: UnitType.Warrior,
  oumaji: UnitType.Rider,
};

export const useGameStore = create<GameStore>((set, get) => ({
  // --- Initial state ---
  gamePhase: 'setup',
  gameState: null,
  stars: 0,
  income: 0,
  turnNumber: 1,
  currentPlayer: 0,
  selectedUnitId: null,
  selectedUnit: null,
  selectedCityPos: null,
  showTechTree: false,
  pendingLevelUp: null,
  battlePreview: null,
  movementRange: null,
  winner: -1,

  initGame: (config: GameConfig, seed?: number) => {
    resetUnitIdCounter();
    const result = generateMap(config, seed);
    const gameState = new GameState(result.map, config);

    // Create capital cities and place starting units
    for (let i = 0; i < config.tribes.length; i++) {
      const tribeId = config.tribes[i];
      const capitalPos = result.capitals[i];
      if (!capitalPos) continue;

      const city = createCity(tribeId, capitalPos, `${tribeId} Capital`, true);
      gameState.addCity(city);

      const unitType = TRIBE_STARTING_UNIT[tribeId] ?? UnitType.Warrior;
      const unit = createUnit(unitType, i, capitalPos.x, capitalPos.y);
      gameState.addUnit(unit);
    }

    // Neutral villages are deferred — they're map markers for future capture mechanics

    set({
      gamePhase: 'playing',
      gameState,
      stars: gameState.getStars(0),
      income: gameState.getIncome(0),
      turnNumber: gameState.getTurnNumber(),
      currentPlayer: gameState.getCurrentPlayer(),
      selectedUnitId: null,
      selectedUnit: null,
      selectedCityPos: null,
      showTechTree: false,
      pendingLevelUp: null,
      battlePreview: null,
      movementRange: null,
      winner: -1,
    });
  },

  selectUnit: (unitId: string) => {
    const { gameState } = get();
    if (!gameState) return;
    const unit = gameState.getUnit(unitId);
    if (!unit) return;

    const range = !unit.hasMoved ? gameState.getMovementRange(unitId) : null;
    set({
      selectedUnitId: unitId,
      selectedUnit: unit,
      selectedCityPos: null,
      movementRange: range,
      battlePreview: null,
    });
  },

  selectCity: (pos: Coord) => {
    const { gameState } = get();
    if (!gameState) return;
    const city = gameState.getCityAt(pos.x, pos.y);
    if (!city) return;

    set({
      selectedCityPos: pos,
      selectedUnitId: null,
      selectedUnit: null,
      movementRange: null,
      battlePreview: null,
    });
  },

  deselect: () => {
    set({
      selectedUnitId: null,
      selectedUnit: null,
      selectedCityPos: null,
      movementRange: null,
      battlePreview: null,
    });
  },

  endTurn: () => {
    const { gameState } = get();
    if (!gameState) return;

    gameState.endTurn();

    // Auto-skip AI turns (players 1+ are AI)
    while (gameState.getCurrentPlayer() !== 0 && gameState.getWinner() < 0) {
      // AI turn placeholder — will be filled by AI module
      gameState.endTurn();
    }

    get().refreshSlices();
    set({
      selectedUnitId: null,
      selectedUnit: null,
      selectedCityPos: null,
      movementRange: null,
      battlePreview: null,
    });
  },

  researchTech: (techId: TechId) => {
    const { gameState } = get();
    if (!gameState) return;
    const player = gameState.getCurrentPlayer();
    gameState.researchTech(player, techId);
    get().refreshSlices();
  },

  trainUnit: (unitType: UnitType) => {
    const { gameState, selectedCityPos } = get();
    if (!gameState || !selectedCityPos) return;
    gameState.trainUnit(selectedCityPos.x, selectedCityPos.y, unitType);
    get().refreshSlices();
  },

  chooseLevelUpReward: (reward: CityLevelRewardOption) => {
    const { gameState, pendingLevelUp } = get();
    if (!gameState || !pendingLevelUp) return;
    const city = pendingLevelUp.city;
    gameState.levelUpCity(city.position.x, city.position.y, reward);
    set({ pendingLevelUp: null });
    get().refreshSlices();
  },

  attackUnit: (targetX: number, targetY: number) => {
    const { gameState, selectedUnitId } = get();
    if (!gameState || !selectedUnitId) return;
    gameState.attackUnit(selectedUnitId, targetX, targetY);
    set({ battlePreview: null });
    get().refreshSlices();

    // Re-read the attacker to see if still alive, update selection
    const updatedAttacker = gameState.getUnit(selectedUnitId);
    if (updatedAttacker) {
      set({ selectedUnit: updatedAttacker });
    } else {
      set({ selectedUnitId: null, selectedUnit: null, movementRange: null });
    }
  },

  showBattlePreview: (targetX: number, targetY: number) => {
    const { gameState, selectedUnitId } = get();
    if (!gameState || !selectedUnitId) return;

    const attacker = gameState.getUnit(selectedUnitId);
    if (!attacker) return;
    const defender = gameState.getUnitAt(targetX, targetY);
    if (!defender || defender.owner === attacker.owner) return;

    const dist = Math.max(Math.abs(attacker.x - targetX), Math.abs(attacker.y - targetY));
    if (dist > attacker.range) return;

    const tile = gameState.map.getTile(targetX, targetY);
    let defenseBonus = tile ? getDefenseBonusForTerrain(tile.type) : 1.0;
    const defenderCity = gameState.getCityAt(targetX, targetY);
    if (defenderCity) {
      defenseBonus = getCityDefenseBonus(defenderCity.hasWall);
    }

    const preview = previewCombat(attacker, defender, defenseBonus, dist);
    const defenderKilled = defender.currentHp - preview.damageToDefender <= 0;
    const attackerKilled = attacker.currentHp - preview.damageToAttacker <= 0;

    set({
      battlePreview: {
        attacker,
        defender,
        damageToDefender: preview.damageToDefender,
        damageToAttacker: preview.damageToAttacker,
        defenderKilled,
        attackerKilled,
      },
    });
  },

  dismissBattlePreview: () => {
    set({ battlePreview: null });
  },

  toggleTechTree: () => {
    set(state => ({ showTechTree: !state.showTechTree }));
  },

  moveSelectedUnit: (toX: number, toY: number) => {
    const { gameState, selectedUnitId } = get();
    if (!gameState || !selectedUnitId) return false;

    const success = gameState.moveUnit(selectedUnitId, toX, toY);
    if (success) {
      const unit = gameState.getUnit(selectedUnitId);
      set({
        selectedUnit: unit ?? null,
        movementRange: null,
      });
      get().refreshSlices();
    }
    return success;
  },

  refreshSlices: () => {
    const { gameState } = get();
    if (!gameState) return;
    const player = gameState.getCurrentPlayer();
    set({
      stars: gameState.getStars(player),
      income: gameState.getIncome(player),
      turnNumber: gameState.getTurnNumber(),
      currentPlayer: player,
      winner: gameState.getWinner(),
    });
  },
}));
