/**
 * CityPanel — Bottom sheet UI for city management.
 *
 * Appears when a city is selected (selectedCityPos is not null).
 * Shows city info (name, level, population, income) and a train tab
 * listing available unit types the player can recruit.
 */

import { useCallback, useMemo } from 'preact/hooks';
import { useGameStore } from '../store/gameStore.js';
import { UnitType } from '../core/types.js';
import { getUnitBaseStats } from '../core/UnitFactory.js';
import { getPopToNextLevel, calculateCityIncome } from '../core/City.js';

/** Display names for unit types. */
const UNIT_DISPLAY_NAMES: Record<UnitType, string> = {
  [UnitType.Warrior]: 'Warrior',
  [UnitType.Archer]: 'Archer',
  [UnitType.Defender]: 'Defender',
  [UnitType.Rider]: 'Rider',
  [UnitType.Swordsman]: 'Swordsman',
  [UnitType.MindBender]: 'Mind Bender',
  [UnitType.Catapult]: 'Catapult',
  [UnitType.Knight]: 'Knight',
  [UnitType.Cloak]: 'Cloak',
  [UnitType.Giant]: 'Giant',
  [UnitType.Raft]: 'Raft',
  [UnitType.Scout]: 'Scout',
  [UnitType.Rammer]: 'Rammer',
  [UnitType.Bomber]: 'Bomber',
};

/** Trainable land units (non-null cost, non-Giant). */
const TRAINABLE_UNITS: readonly UnitType[] = [
  UnitType.Warrior,
  UnitType.Archer,
  UnitType.Defender,
  UnitType.Rider,
  UnitType.Swordsman,
  UnitType.MindBender,
  UnitType.Catapult,
  UnitType.Knight,
  UnitType.Cloak,
];

export function CityPanel() {
  const selectedCityPos = useGameStore(s => s.selectedCityPos);
  const gameState = useGameStore(s => s.gameState);
  const stars = useGameStore(s => s.stars);
  const currentPlayer = useGameStore(s => s.currentPlayer);
  const deselect = useGameStore(s => s.deselect);
  const trainUnit = useGameStore(s => s.trainUnit);

  const city = useMemo(() => {
    if (!gameState || !selectedCityPos) return null;
    return gameState.getCityAt(selectedCityPos.x, selectedCityPos.y) ?? null;
  }, [gameState, selectedCityPos]);

  const techState = useMemo(() => {
    if (!gameState) return null;
    return gameState.getTechState(currentPlayer);
  }, [gameState, currentPlayer]);

  const tileOccupied = useMemo(() => {
    if (!gameState || !selectedCityPos) return false;
    return gameState.getUnitAt(selectedCityPos.x, selectedCityPos.y) !== undefined;
  }, [gameState, selectedCityPos]);

  const handleTrain = useCallback(
    (unitType: UnitType) => {
      trainUnit(unitType);
    },
    [trainUnit],
  );

  const handleBackdropClick = useCallback(() => {
    deselect();
  }, [deselect]);

  if (!selectedCityPos || !city || !techState) return null;

  const popNeeded = getPopToNextLevel(city.level);
  const popFraction = popNeeded > 0 ? Math.min(city.population / popNeeded, 1) : 0;
  const income = calculateCityIncome(city);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Semi-transparent backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }}
      />

      {/* Bottom sheet panel */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#1a1a2e',
          borderTop: '2px solid rgba(255, 255, 255, 0.15)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          padding: '16px',
          maxHeight: '60vh',
          overflowY: 'auto',
          color: '#fff',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleBackdropClick}
          aria-label="Close city panel"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            minWidth: '48px',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          {'\u2715'}
        </button>

        {/* City header */}
        <div style={{ marginBottom: '12px', paddingRight: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700 }}>
              {city.name}
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                padding: '2px 6px',
              }}
            >
              Lv {city.level}
            </span>
            {city.isCapital && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#d4a017',
                  color: '#1a1a2e',
                  borderRadius: '4px',
                  padding: '2px 6px',
                }}
              >
                Capital
              </span>
            )}
          </div>
        </div>

        {/* Population progress bar */}
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Population
            </span>
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
              {city.population} / {popNeeded}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${popFraction * 100}%`,
                height: '100%',
                backgroundColor: '#4caf50',
                borderRadius: '4px',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>

        {/* Income display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Income:</span>
          <span style={{ fontWeight: 700, color: '#ffd700' }}>
            {'\u2B50'} {income} / turn
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            marginBottom: '12px',
          }}
        />

        {/* Train tab header */}
        <div
          style={{
            fontSize: '15px',
            fontWeight: 700,
            marginBottom: '10px',
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          Train Unit
        </div>

        {/* Unit list */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '8px',
          }}
        >
          {TRAINABLE_UNITS.map(unitType => {
            const isUnlocked =
              unitType === UnitType.Warrior || techState.isUnitUnlocked(unitType);
            if (!isUnlocked) return null;

            const stats = getUnitBaseStats(unitType);
            const cost = stats.cost ?? 0;
            const canAfford = stars >= cost;
            const disabled = !canAfford || tileOccupied;

            return (
              <button
                key={unitType}
                type="button"
                onClick={() => {
                  if (!disabled) handleTrain(unitType);
                }}
                disabled={disabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: '48px',
                  padding: '10px 12px',
                  backgroundColor: disabled
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.12)',
                  border: disabled
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '8px',
                  color: disabled ? 'rgba(255, 255, 255, 0.35)' : '#fff',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'sans-serif',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
              >
                <span>{UNIT_DISPLAY_NAMES[unitType]}</span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: disabled
                      ? 'rgba(255, 255, 255, 0.3)'
                      : '#ffd700',
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}
                >
                  {'\u2B50'} {cost}
                </span>
              </button>
            );
          })}
        </div>

        {/* Occupied warning */}
        {tileOccupied && (
          <div
            style={{
              marginTop: '10px',
              fontSize: '13px',
              color: '#ff8a80',
              textAlign: 'center',
            }}
          >
            City tile is occupied by a unit
          </div>
        )}
      </div>
    </div>
  );
}
