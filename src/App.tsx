import { useEffect, useRef } from 'preact/hooks';
import { Application } from 'pixi.js';
import { GameMap } from './core/GameMap.js';
import { GameState } from './core/GameState.js';
import { TileType, UnitType } from './core/types.js';
import type { GameConfig } from './core/types.js';
import { createUnit, resetUnitIdCounter } from './core/UnitFactory.js';
import { GameRenderer } from './render/GameRenderer.js';
import { Camera } from './input/Camera.js';
import { InputHandler } from './input/InputHandler.js';
import { TILE_SIZE } from './render/constants.js';

/**
 * Build a sample 16x16 map with mixed terrain:
 *   - Mostly fields
 *   - Clusters of forest
 *   - Some mountains
 *   - A lake (shallow water + ocean core)
 */
function createSampleMap(): GameMap {
  const map = GameMap.create(16, 16, TileType.Field);

  // -- Forest clusters (upper-left and mid-right) --
  const forestTiles: [number, number][] = [
    // Upper-left cluster
    [1, 1], [2, 1], [3, 1],
    [1, 2], [2, 2], [3, 2], [4, 2],
    [2, 3], [3, 3],
    // Mid-right cluster
    [11, 5], [12, 5], [13, 5],
    [11, 6], [12, 6], [13, 6], [14, 6],
    [12, 7], [13, 7], [14, 7],
    [13, 8],
    // Small southern patch
    [5, 12], [6, 12], [6, 13], [7, 13],
  ];
  for (const [x, y] of forestTiles) {
    map.setTile(x, y, TileType.Forest);
  }

  // -- Mountain range (diagonal from center-left to upper-right) --
  const mountainTiles: [number, number][] = [
    [6, 4], [7, 3], [8, 3], [9, 2], [10, 2],
    [7, 4], [8, 4],
    [10, 1], [11, 1],
    // Small southern mountain
    [2, 10], [3, 10], [3, 11],
  ];
  for (const [x, y] of mountainTiles) {
    map.setTile(x, y, TileType.Mountain);
  }

  // -- Lake (shallow water ring with ocean core, lower-right area) --
  const shallowWaterTiles: [number, number][] = [
    [9, 10], [10, 9], [11, 9], [12, 9],
    [9, 11], [13, 10],
    [9, 12], [13, 11],
    [10, 13], [11, 13], [12, 13], [13, 12],
  ];
  for (const [x, y] of shallowWaterTiles) {
    map.setTile(x, y, TileType.ShallowWater);
  }

  const oceanTiles: [number, number][] = [
    [10, 10], [11, 10], [12, 10],
    [10, 11], [11, 11], [12, 11],
    [10, 12], [11, 12], [12, 12],
  ];
  for (const [x, y] of oceanTiles) {
    map.setTile(x, y, TileType.Ocean);
  }

  return map;
}

/** Default game config for the sample 2-player game. */
const SAMPLE_CONFIG: GameConfig = {
  mapSize: 16,
  waterLevel: 0.3,
  tribes: ['xinxi', 'imperius'],
  difficulty: 'normal',
  winCondition: 'domination',
  turnLimit: null,
};

export function App() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application();
    let renderer: GameRenderer | undefined;
    let inputHandler: InputHandler | undefined;

    const init = async () => {
      await app.init({
        resizeTo: canvasRef.current!,
        background: '#1a1a2e',
        antialias: true,
      });
      canvasRef.current!.appendChild(app.canvas);

      const gameMap = createSampleMap();

      // --- Game state ---
      resetUnitIdCounter();
      const gameState = new GameState(gameMap, SAMPLE_CONFIG);

      // Place starter units: Player 0 (blue) on the left, Player 1 (red) on the right
      const starterUnits = [
        // Player 0 warriors (left side)
        createUnit(UnitType.Warrior, 0, 0, 5),
        createUnit(UnitType.Warrior, 0, 1, 7),
        createUnit(UnitType.Warrior, 0, 0, 9),
        createUnit(UnitType.Rider,   0, 2, 6),
        // Player 1 warriors (right side)
        createUnit(UnitType.Warrior, 1, 15, 5),
        createUnit(UnitType.Warrior, 1, 14, 7),
        createUnit(UnitType.Warrior, 1, 15, 9),
        createUnit(UnitType.Rider,   1, 13, 6),
      ];

      for (const unit of starterUnits) {
        gameState.addUnit(unit);
      }

      // --- Selection state ---
      let selectedUnitId: string | null = null;
      let movementRange: Set<string> | null = null;

      // --- Renderer ---
      renderer = new GameRenderer(app, gameMap);
      renderer.render();

      /** Refresh the unit and overlay rendering. */
      function refreshDisplay(): void {
        if (!renderer) return;

        const selectedUnit = selectedUnitId !== null
          ? gameState.getUnit(selectedUnitId) ?? null
          : null;
        const selectedCoord = selectedUnit !== null
          ? { x: selectedUnit.x, y: selectedUnit.y }
          : null;

        renderer.renderUnits(gameState.getAllUnits(), selectedUnitId);
        renderer.renderOverlay(movementRange, selectedCoord);
      }

      refreshDisplay();

      // --- Camera & input ---
      const camera = new Camera();
      const mapPixelWidth = gameMap.width * TILE_SIZE;
      const mapPixelHeight = gameMap.height * TILE_SIZE;

      camera.clampBounds(
        mapPixelWidth,
        mapPixelHeight,
        app.canvas.clientWidth,
        app.canvas.clientHeight,
      );
      camera.applyTransform(renderer.mapContainer);

      /** Handle a tap/click in world coordinates. */
      function onTileTap(worldX: number, worldY: number): void {
        const tileX = Math.floor(worldX / TILE_SIZE);
        const tileY = Math.floor(worldY / TILE_SIZE);

        if (!gameMap.isInBounds(tileX, tileY)) {
          // Clicked outside map: deselect
          selectedUnitId = null;
          movementRange = null;
          refreshDisplay();
          return;
        }

        // If a unit is selected and the clicked tile is in movement range, move
        if (selectedUnitId !== null && movementRange !== null) {
          const key = `${tileX},${tileY}`;
          if (movementRange.has(key)) {
            gameState.moveUnit(selectedUnitId, tileX, tileY);
            selectedUnitId = null;
            movementRange = null;
            refreshDisplay();
            return;
          }
        }

        // Check if there's a unit at the clicked tile
        const unitAtTile = gameState.getUnitAt(tileX, tileY);

        if (unitAtTile !== undefined && unitAtTile.owner === gameState.getCurrentPlayer()) {
          // Select this unit
          if (!unitAtTile.hasMoved) {
            selectedUnitId = unitAtTile.id;
            movementRange = gameState.getMovementRange(unitAtTile.id);
          } else {
            // Unit already moved; just highlight it, no movement range
            selectedUnitId = unitAtTile.id;
            movementRange = null;
          }
        } else {
          // Clicked empty tile or enemy unit: deselect
          selectedUnitId = null;
          movementRange = null;
        }

        refreshDisplay();
      }

      inputHandler = new InputHandler(
        camera,
        app.canvas,
        mapPixelWidth,
        mapPixelHeight,
        () => camera.applyTransform(renderer!.mapContainer),
        onTileTap,
      );
    };

    init();

    return () => {
      inputHandler?.destroy();
      renderer?.destroy();
      app.destroy(true);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={canvasRef} id="game-canvas" style={{ width: '100%', height: '100%' }} />
      <div id="ui-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', pointerEvents: 'none' }}>
        <div style={{ padding: '12px 16px', color: '#fff', fontFamily: 'sans-serif', fontSize: '14px', pointerEvents: 'auto' }}>
          PolyClone2 — Phase 1: Unit Placement & Movement
        </div>
      </div>
    </div>
  );
}
