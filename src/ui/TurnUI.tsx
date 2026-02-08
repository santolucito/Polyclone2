/**
 * Turn UI overlay component for PolyClone2.
 *
 * Displays:
 *   - Current player indicator (name + color)
 *   - Turn counter
 *   - "End Turn" button
 */

/** Player colors: index 0 = blue (Player 1), index 1 = red (Player 2). */
const PLAYER_COLORS = ['#4a90d9', '#d94a4a'];
const PLAYER_NAMES = ['Player 1', 'Player 2'];

export interface TurnUIProps {
  readonly currentPlayer: number;
  readonly turnNumber: number;
  readonly onEndTurn: () => void;
}

export function TurnUI({ currentPlayer, turnNumber, onEndTurn }: TurnUIProps) {
  const playerColor = PLAYER_COLORS[currentPlayer] ?? '#888';
  const playerName = PLAYER_NAMES[currentPlayer] ?? `Player ${currentPlayer + 1}`;

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
      {/* Top bar: Turn indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          pointerEvents: 'auto',
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
          Turn {turnNumber} &mdash; {playerName}
        </span>
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
          onClick={onEndTurn}
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
