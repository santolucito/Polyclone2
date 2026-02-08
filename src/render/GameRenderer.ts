/**
 * Main renderer for the PolyClone2 game map.
 *
 * Takes a PixiJS Application and a GameMap, creates Containers for
 * tiles, overlays, and units, and provides lifecycle methods.
 */

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameMap } from '../core/GameMap.js';
import { CityInstance, Coord, UnitInstance } from '../core/types.js';
import { createTileGraphic } from './TileRenderer.js';
import { renderUnitsToContainer } from './UnitRenderer.js';
import {
  renderMovementOverlay,
  renderSelectionHighlight,
} from './OverlayRenderer.js';
import { isoToGrid, gridToIsoCenter, TILE_HEIGHT } from './CoordinateUtils.js';

export class GameRenderer {
  private readonly app: Application;
  private readonly gameMap: GameMap;

  /** Top-level container for all map graphics. Child of `app.stage`. */
  readonly mapContainer: Container;

  /** Layer for tile graphics. */
  private readonly tileLayer: Container;

  /** Layer for city graphics (between tiles and overlays). */
  private readonly cityLayer: Container;

  /** Layer for overlay graphics (movement range, selection). */
  private readonly overlayLayer: Container;

  /** Layer for unit graphics. */
  private readonly unitLayer: Container;

  /** References to individual tile graphics so we can update/destroy them. */
  private tileGraphics: Graphics[] = [];

  constructor(app: Application, gameMap: GameMap) {
    this.app = app;
    this.gameMap = gameMap;

    this.mapContainer = new Container();
    this.tileLayer = new Container();
    this.cityLayer = new Container();
    this.overlayLayer = new Container();
    this.unitLayer = new Container();

    // Layer order: tiles -> cities -> overlays -> units
    this.mapContainer.addChild(this.tileLayer);
    this.mapContainer.addChild(this.cityLayer);
    this.mapContainer.addChild(this.overlayLayer);
    this.mapContainer.addChild(this.unitLayer);

    this.app.stage.addChild(this.mapContainer);
  }

  /**
   * Full (re-)render of the map tiles. Clears any existing tile graphics
   * and rebuilds them from the current GameMap state.
   */
  render(): void {
    this.clearTiles();

    for (let y = 0; y < this.gameMap.height; y++) {
      for (let x = 0; x < this.gameMap.width; x++) {
        const tile = this.gameMap.getTile(x, y);
        if (tile === null) continue;

        const graphic = createTileGraphic(tile, this.gameMap.height);
        this.tileLayer.addChild(graphic);
        this.tileGraphics.push(graphic);
      }
    }
  }

  /**
   * Render city markers on the map.
   */
  renderCities(cities: CityInstance[]): void {
    this.clearCities();
    for (const city of cities) {
      const graphic = createCityGraphic(city, this.gameMap.height);
      this.cityLayer.addChild(graphic);
    }
  }

  /**
   * Render all units onto the unit layer.
   */
  renderUnits(units: UnitInstance[], selectedUnitId: string | null): void {
    this.clearUnits();
    const container = renderUnitsToContainer(units, selectedUnitId, this.gameMap.height);
    this.unitLayer.addChild(container);
  }

  /**
   * Render the movement range overlay and selection highlight.
   */
  renderOverlay(
    movementRange: Set<string> | null,
    selectedCoord: Coord | null,
  ): void {
    this.clearOverlay();

    if (selectedCoord !== null) {
      const highlight = renderSelectionHighlight(selectedCoord, this.gameMap.height);
      this.overlayLayer.addChild(highlight);
    }

    if (movementRange !== null) {
      const overlay = renderMovementOverlay(movementRange, this.gameMap.height);
      this.overlayLayer.addChild(overlay);
    }
  }

  /**
   * Convert pixel coordinates (from a click event on the canvas) to
   * tile grid coordinates. Returns null if the click is out of map bounds.
   */
  pixelToTile(pixelX: number, pixelY: number): Coord | null {
    const result = isoToGrid(pixelX, pixelY, this.gameMap.width, this.gameMap.height);
    if (result === null) return null;
    if (!this.gameMap.isInBounds(result.x, result.y)) return null;
    return result;
  }

  /** Remove all tile graphics from the tile layer. */
  private clearTiles(): void {
    for (const g of this.tileGraphics) {
      g.destroy();
    }
    this.tileGraphics = [];
    this.tileLayer.removeChildren();
  }

  /** Remove all city graphics. */
  private clearCities(): void {
    this.cityLayer.removeChildren();
  }

  /** Remove all overlay graphics. */
  private clearOverlay(): void {
    this.overlayLayer.removeChildren();
  }

  /** Remove all unit graphics. */
  private clearUnits(): void {
    this.unitLayer.removeChildren();
  }

  /** Clean up: remove the map container from the stage and destroy it. */
  destroy(): void {
    this.clearTiles();
    this.clearCities();
    this.clearOverlay();
    this.clearUnits();
    this.app.stage.removeChild(this.mapContainer);
    this.mapContainer.destroy();
  }
}

// ---------------------------------------------------------------------------
// City rendering
// ---------------------------------------------------------------------------

/** Tribe -> fill color for city markers. */
const TRIBE_COLORS: Record<string, number> = {
  xinxi: 0xd13440,
  imperius: 0x3f51b5,
  bardur: 0x795548,
  oumaji: 0xffc107,
};

/** Creates a PixiJS Container for a city marker on the map. */
function createCityGraphic(city: CityInstance, mapHeight: number): Container {
  const container = new Container();
  const { cx, cy } = gridToIsoCenter(city.position.x, city.position.y, mapHeight);
  container.position.set(cx, cy);

  const fillColor = TRIBE_COLORS[city.owner] ?? 0x888888;
  const size = TILE_HEIGHT * 0.55;

  // City base: rounded square
  const base = new Graphics();
  base.roundRect(-size / 2, -size / 2, size, size, 3)
    .fill({ color: fillColor })
    .stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
  container.addChild(base);

  // Capital marker: small diamond on top
  if (city.isCapital) {
    const star = new Graphics();
    const s = 4;
    star.moveTo(0, -size / 2 - s - 2)
      .lineTo(s, -size / 2 - 2)
      .lineTo(0, -size / 2 + s - 2)
      .lineTo(-s, -size / 2 - 2)
      .closePath()
      .fill({ color: 0xffd700 });
    container.addChild(star);
  }

  // Level text
  const style = new TextStyle({
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fill: 0xffffff,
  });
  const text = new Text({ text: String(city.level), style });
  text.anchor.set(0.5, 0.5);
  container.addChild(text);

  return container;
}
