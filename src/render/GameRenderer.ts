/**
 * Main renderer for the PolyClone2 game map.
 *
 * Takes a PixiJS Application and a GameMap, creates Containers for
 * tiles, overlays, and units, and provides lifecycle methods.
 */

import { Application, Container, Graphics } from 'pixi.js';
import { GameMap } from '../core/GameMap.js';
import { Coord, UnitInstance } from '../core/types.js';
import { createTileGraphic } from './TileRenderer.js';
import { renderUnitsToContainer } from './UnitRenderer.js';
import {
  renderMovementOverlay,
  renderSelectionHighlight,
} from './OverlayRenderer.js';
import { TILE_SIZE } from './constants.js';

export class GameRenderer {
  private readonly app: Application;
  private readonly gameMap: GameMap;

  /** Top-level container for all map graphics. Child of `app.stage`. */
  readonly mapContainer: Container;

  /** Layer for tile graphics. */
  private readonly tileLayer: Container;

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
    this.overlayLayer = new Container();
    this.unitLayer = new Container();

    // Layer order: tiles -> overlays -> units
    this.mapContainer.addChild(this.tileLayer);
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

        const graphic = createTileGraphic(tile);
        this.tileLayer.addChild(graphic);
        this.tileGraphics.push(graphic);
      }
    }
  }

  /**
   * Render all units onto the unit layer.
   */
  renderUnits(units: UnitInstance[], selectedUnitId: string | null): void {
    this.clearUnits();
    const container = renderUnitsToContainer(units, selectedUnitId);
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
      const highlight = renderSelectionHighlight(selectedCoord);
      this.overlayLayer.addChild(highlight);
    }

    if (movementRange !== null) {
      const overlay = renderMovementOverlay(movementRange);
      this.overlayLayer.addChild(overlay);
    }
  }

  /**
   * Convert pixel coordinates (from a click event on the canvas) to
   * tile grid coordinates. Returns null if the click is out of map bounds.
   */
  pixelToTile(pixelX: number, pixelY: number): Coord | null {
    const x = Math.floor(pixelX / TILE_SIZE);
    const y = Math.floor(pixelY / TILE_SIZE);
    if (!this.gameMap.isInBounds(x, y)) return null;
    return { x, y };
  }

  /** Remove all tile graphics from the tile layer. */
  private clearTiles(): void {
    for (const g of this.tileGraphics) {
      g.destroy();
    }
    this.tileGraphics = [];
    this.tileLayer.removeChildren();
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
    this.clearOverlay();
    this.clearUnits();
    this.app.stage.removeChild(this.mapContainer);
    this.mapContainer.destroy();
  }
}
