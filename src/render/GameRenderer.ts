/**
 * Main renderer for the PolyClone2 game map.
 *
 * Takes a PixiJS Application and a GameMap, creates a Container that holds
 * every tile graphic, and provides render() / destroy() lifecycle methods.
 */

import { Application, Container, Graphics } from 'pixi.js';
import { GameMap } from '../core/GameMap.js';
import { createTileGraphic } from './TileRenderer.js';

export class GameRenderer {
  private readonly app: Application;
  private readonly gameMap: GameMap;

  /** Top-level container for all map graphics. */
  private readonly mapContainer: Container;

  /** References to individual tile graphics so we can update/destroy them. */
  private tileGraphics: Graphics[] = [];

  constructor(app: Application, gameMap: GameMap) {
    this.app = app;
    this.gameMap = gameMap;
    this.mapContainer = new Container();
    this.app.stage.addChild(this.mapContainer);
  }

  /**
   * Full (re-)render of the map. Clears any existing tile graphics and
   * rebuilds them from the current GameMap state.
   */
  render(): void {
    this.clearTiles();

    for (let y = 0; y < this.gameMap.height; y++) {
      for (let x = 0; x < this.gameMap.width; x++) {
        const tile = this.gameMap.getTile(x, y);
        if (tile === null) continue;

        const graphic = createTileGraphic(tile);
        this.mapContainer.addChild(graphic);
        this.tileGraphics.push(graphic);
      }
    }
  }

  /** Remove all tile graphics from the container. */
  private clearTiles(): void {
    for (const g of this.tileGraphics) {
      g.destroy();
    }
    this.tileGraphics = [];
  }

  /** Clean up: remove the map container from the stage and destroy it. */
  destroy(): void {
    this.clearTiles();
    this.app.stage.removeChild(this.mapContainer);
    this.mapContainer.destroy();
  }
}
