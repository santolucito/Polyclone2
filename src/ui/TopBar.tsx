/**
 * Top bar UI overlay for PolyClone2.
 *
 * Displays:
 *   - Left: Star counter with income ("23 (+8)")
 *   - Center: Turn number with player color dot
 *   - Right: Tech tree button, settings button
 *   - Bottom-right: End Turn button
 *
 * Reads directly from the Zustand game store (no props needed).
 */

import { useGameStore } from '../store/gameStore.js';

/** Player colors: index 0 = blue (Player 1), index 1 = red (Player 2). */
const PLAYER_COLORS = ['#4a90d9', '#d94a4a'];

export function TopBar() {
  const stars = useGameStore(s => s.stars);
  const income = useGameStore(s => s.income);
  const turnNumber = useGameStore(s => s.turnNumber);
  const currentPlayer = useGameStore(s => s.currentPlayer);
  const endTurn = useGameStore(s => s.endTurn);
  const toggleTechTree = useGameStore(s => s.toggleTechTree);

  const playerColor = PLAYER_COLORS[currentPlayer] ?? '#888';
  const incomeSign = income >= 0 ? '+' : '';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top bar row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
        }}
      >
        {/* Left section: Star counter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'auto',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              lineHeight: 1,
            }}
            aria-label="Stars"
          >
            {'\u2B50'}
          </span>
          <span
            style={{
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              textShadow: '0 1px 3px rgba(0,0,0,0.7)',
            }}
          >
            {stars}
          </span>
          <span
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '13px',
              fontWeight: 500,
              textShadow: '0 1px 3px rgba(0,0,0,0.7)',
            }}
          >
            ({incomeSign}{income})
          </span>
        </div>

        {/* Center section: Turn indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: playerColor,
              border: '2px solid rgba(255,255,255,0.6)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              textShadow: '0 1px 3px rgba(0,0,0,0.7)',
            }}
          >
            Turn {turnNumber}
          </span>
        </div>

        {/* Right section: Tech + Settings buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={toggleTechTree}
            style={{
              pointerEvents: 'auto',
              minWidth: '48px',
              minHeight: '48px',
              padding: '8px 14px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#fff',
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '8px',
              cursor: 'pointer',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Open tech tree"
          >
            Tech
          </button>
          <button
            type="button"
            onClick={() => {
              // Settings handler placeholder
            }}
            style={{
              pointerEvents: 'auto',
              minWidth: '48px',
              minHeight: '48px',
              padding: '8px',
              fontSize: '20px',
              color: '#fff',
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
            aria-label="Settings"
          >
            {'\u2699'}
          </button>
        </div>
      </div>

      {/* Bottom-right: End Turn button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '16px',
        }}
      >
        <button
          type="button"
          onClick={endTurn}
          style={{
            pointerEvents: 'auto',
            minWidth: '120px',
            minHeight: '48px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 700,
            color: '#fff',
            backgroundColor: playerColor,
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            transition: 'opacity 0.15s',
          }}
        >
          End Turn
        </button>
      </div>
    </div>
  );
}
