/**
 * Unit info panel for PolyClone2.
 *
 * Displays a compact bottom panel when a unit is selected, showing:
 *   - Unit type name
 *   - HP bar (currentHp / maxHp)
 *   - ATK, DEF, Move, Range stats
 *   - Kill count with veteran star indicator
 *
 * Reads selectedUnit from the Zustand game store; renders nothing when no unit
 * is selected.
 */

import { useGameStore } from '../store/gameStore.js';

/** Player colors: index 0 = blue (Player 1), index 1 = red (Player 2). */
const PLAYER_COLORS = ['#4a90d9', '#d94a4a'];

/** Format unit type enum value into a display name (e.g. "mindBender" -> "Mind Bender"). */
function formatUnitName(type: string): string {
  return type
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase());
}

export function UnitInfoPanel() {
  const selectedUnit = useGameStore(s => s.selectedUnit);

  if (!selectedUnit) return null;

  const hpFraction = selectedUnit.maxHp > 0
    ? selectedUnit.currentHp / selectedUnit.maxHp
    : 0;

  // HP bar color: green > yellow > red based on remaining health
  let hpColor = '#4caf50';
  if (hpFraction <= 0.3) {
    hpColor = '#e53935';
  } else if (hpFraction <= 0.6) {
    hpColor = '#ffb300';
  }

  const ownerColor = PLAYER_COLORS[selectedUnit.owner] ?? '#888';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderRadius: '10px',
        padding: '10px 16px',
        fontFamily: 'sans-serif',
        color: '#fff',
        minWidth: '240px',
        maxWidth: '340px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        border: `2px solid ${ownerColor}`,
      }}
    >
      {/* Header: Unit name + veteran star */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {formatUnitName(selectedUnit.type)}
        </span>
        {selectedUnit.isVeteran && (
          <span
            style={{
              fontSize: '14px',
              color: '#ffd700',
              textShadow: '0 0 4px rgba(255,215,0,0.6)',
            }}
            title="Veteran"
          >
            {'\u2605'}
          </span>
        )}
      </div>

      {/* HP bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            width: '24px',
            flexShrink: 0,
          }}
        >
          HP
        </span>
        <div
          style={{
            flex: 1,
            height: '8px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(100, hpFraction * 100))}%`,
              height: '100%',
              backgroundColor: hpColor,
              borderRadius: '4px',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
            width: '48px',
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {selectedUnit.currentHp}/{selectedUnit.maxHp}
        </span>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '4px',
          marginBottom: selectedUnit.kills > 0 ? '6px' : '0',
        }}
      >
        <StatItem label="ATK" value={selectedUnit.atk} />
        <StatItem label="DEF" value={selectedUnit.def} />
        <StatItem label="Move" value={selectedUnit.movement} />
        <StatItem label="Range" value={selectedUnit.range} />
      </div>

      {/* Kills row (only shown if kills > 0) */}
      {selectedUnit.kills > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              color: '#e53935',
            }}
          >
            {'\u2694'}
          </span>
          <span>
            {selectedUnit.kills} kill{selectedUnit.kills !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

/** Small stat display cell. */
function StatItem({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '40px',
      }}
    >
      <span
        style={{
          fontSize: '10px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#fff',
        }}
      >
        {value}
      </span>
    </div>
  );
}
