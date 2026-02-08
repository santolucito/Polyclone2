import { useEffect, useRef } from 'preact/hooks';
import { Application } from 'pixi.js';

export function App() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application();

    const init = async () => {
      await app.init({
        resizeTo: canvasRef.current!,
        background: '#1a1a2e',
        antialias: true,
      });
      canvasRef.current!.appendChild(app.canvas);
    };

    init();

    return () => {
      app.destroy(true);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={canvasRef} id="game-canvas" style={{ width: '100%', height: '100%' }} />
      <div id="ui-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', pointerEvents: 'none' }}>
        <div style={{ padding: '12px 16px', color: '#fff', fontFamily: 'sans-serif', fontSize: '14px', pointerEvents: 'auto' }}>
          PolyClone2 — Phase 0
        </div>
      </div>
    </div>
  );
}
