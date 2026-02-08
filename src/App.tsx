import { useEffect, useRef, useState } from 'preact/hooks';
import { Application } from 'pixi.js';
import { GameRenderer } from './render/GameRenderer.js';
import { Camera } from './input/Camera.js';
import { InputHandler } from './input/InputHandler.js';
import { getIsoBounds, isoToGrid } from './render/CoordinateUtils.js';
import { useGameStore } from './store/gameStore.js';
import { TopBar } from './ui/TopBar.js';
import { UnitInfoPanel } from './ui/UnitInfoPanel.js';
import { TechTreePanel } from './ui/TechTreePanel.js';
import { LevelUpModal } from './ui/LevelUpModal.js';
import { CityPanel } from './ui/CityPanel.js';
import { BattlePreview } from './ui/BattlePreview.js';
import { GameSetup } from './ui/GameSetup.js';

export function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const rendererRef = useRef<GameRenderer | null>(null);
  const refreshDisplayRef = useRef<(() => void) | null>(null);

  // Zustand store
  const gamePhase = useGameStore(s => s.gamePhase);
  const gameState = useGameStore(s => s.gameState);
  const selectUnit = useGameStore(s => s.selectUnit);
  const selectCity = useGameStore(s => s.selectCity);
  const deselect = useGameStore(s => s.deselect);
  const moveSelectedUnit = useGameStore(s => s.moveSelectedUnit);
  const attackUnit = useGameStore(s => s.attackUnit);

  // Set up PixiJS when gameState becomes available
  useEffect(() => {
    if (!canvasRef.current || !gameState) return;

    // Capture non-null reference for closures
    const gs = gameState;
    const app = new Application();
    let inputHandler: InputHandler | undefined;

    const init = async () => {
      await app.init({
        resizeTo: canvasRef.current!,
        background: '#1a1a2e',
        antialias: true,
      });
      canvasRef.current!.appendChild(app.canvas);

      const gameMap = gs.map;

      // --- Renderer ---
      const renderer = new GameRenderer(app, gameMap);
      rendererRef.current = renderer;
      renderer.render();

      /** Refresh the unit and overlay rendering. */
      function refreshDisplay(): void {
        const store = useGameStore.getState();
        const selectedUnit = store.selectedUnitId !== null
          ? gs.getUnit(store.selectedUnitId) ?? null
          : null;
        const selectedCoord = selectedUnit !== null
          ? { x: selectedUnit.x, y: selectedUnit.y }
          : null;

        renderer.renderUnits(gs.getAllUnits(), store.selectedUnitId);
        renderer.renderOverlay(store.movementRange, selectedCoord);
      }

      refreshDisplayRef.current = refreshDisplay;
      refreshDisplay();

      // Subscribe to store changes to auto-refresh display
      const unsub = useGameStore.subscribe(() => {
        refreshDisplay();
      });

      // --- Camera & input ---
      const camera = new Camera();
      const { width: mapPixelWidth, height: mapPixelHeight } = getIsoBounds(gameMap.width, gameMap.height);

      camera.clampBounds(
        mapPixelWidth,
        mapPixelHeight,
        app.canvas.clientWidth,
        app.canvas.clientHeight,
      );
      camera.applyTransform(renderer.mapContainer);

      /** Handle a tap/click in world coordinates. */
      function onTileTap(worldX: number, worldY: number): void {
        const gridCoord = isoToGrid(worldX, worldY, gameMap.width, gameMap.height);
        if (gridCoord === null || !gameMap.isInBounds(gridCoord.x, gridCoord.y)) {
          deselect();
          return;
        }
        const tileX = gridCoord.x;
        const tileY = gridCoord.y;

        const store = useGameStore.getState();

        // If a unit is selected and the clicked tile is in movement range, move
        if (store.selectedUnitId !== null && store.movementRange !== null) {
          const key = `${tileX},${tileY}`;
          if (store.movementRange.has(key)) {
            moveSelectedUnit(tileX, tileY);
            return;
          }
        }

        // If a unit is selected and we click an enemy in range, show battle preview / attack
        if (store.selectedUnitId !== null) {
          const enemyUnit = gs.getUnitAt(tileX, tileY);
          if (enemyUnit && enemyUnit.owner !== gs.getCurrentPlayer()) {
            const attacker = gs.getUnit(store.selectedUnitId);
            if (attacker && !attacker.hasAttacked) {
              const dist = Math.max(Math.abs(attacker.x - tileX), Math.abs(attacker.y - tileY));
              if (dist <= attacker.range) {
                // Direct attack on tap (battle preview via long-press is future work)
                attackUnit(tileX, tileY);
                return;
              }
            }
          }
        }

        // Check if there's a unit at the clicked tile
        const unitAtTile = gs.getUnitAt(tileX, tileY);

        if (unitAtTile !== undefined && unitAtTile.owner === gs.getCurrentPlayer()) {
          selectUnit(unitAtTile.id);
        } else {
          // Check if there's a city
          const city = gs.getCityAt(tileX, tileY);
          const playerTribe = gs.getTribeForPlayer(gs.getCurrentPlayer());
          if (city && city.owner === playerTribe) {
            selectCity({ x: tileX, y: tileY });
          } else {
            deselect();
          }
        }
      }

      inputHandler = new InputHandler(
        camera,
        app.canvas,
        mapPixelWidth,
        mapPixelHeight,
        () => camera.applyTransform(renderer.mapContainer),
        onTileTap,
      );

      setLoading(false);

      // Return cleanup for the subscription
      return unsub;
    };

    let unsub: (() => void) | undefined;
    init().then((u) => { unsub = u; }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message + '\n' + err.stack : String(err);
      setError(msg);
      setLoading(false);
      console.error('Init failed:', err);
    });

    return () => {
      unsub?.();
      inputHandler?.destroy();
      rendererRef.current?.destroy();
      rendererRef.current = null;
      refreshDisplayRef.current = null;
      app.destroy(true);
    };
  }, [gameState]);

  // Show setup screen before game starts
  if (gamePhase === 'setup') {
    return <GameSetup />;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={canvasRef} id="game-canvas" style={{ width: '100%', height: '100%' }} />
      {error && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(200,0,0,0.9)', color: '#fff', padding: '20px', borderRadius: '8px',
          maxWidth: '80%', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap', zIndex: 100,
        }}>
          Error: {error}
        </div>
      )}
      {loading && !error && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          color: '#fff', fontFamily: 'sans-serif', fontSize: '18px', zIndex: 100,
        }}>
          Loading...
        </div>
      )}
      <TopBar />
      <UnitInfoPanel />
      <CityPanel />
      <BattlePreview />
      <TechTreePanel />
      <LevelUpModal />
    </div>
  );
}
