import type { SimulationType } from "@/types/simulation-type";
import {
  Application,
  Container,
  FederatedPointerEvent,
  Graphics,
  Ticker,
} from "pixi.js";
import { useCallback, useEffect, useRef } from "react";

function clearAndDrawGridGraphic(
  graphic: Graphics,
  grid: number[][],
  cellSize: number,
  gridGap: number,
): Graphics {
  graphic.clear();

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const color = grid[row][col] === 0 ? 0xefefef : 0x0f0f0f;

      const x = col * (cellSize + gridGap);
      const y = row * (cellSize + gridGap);

      graphic.rect(x, y, cellSize, cellSize).fill(color);
    }
  }

  return graphic;
}

type CanvasProps = {
  simulation: SimulationType;
  setSimulation: React.Dispatch<React.SetStateAction<SimulationType>>;
  speed: number[];
  isPlaying: boolean;
  proceedGen: (grid: number[][]) => number[][];
};

export default function Canvas({
  simulation,
  setSimulation,
  isPlaying,
  speed,
  proceedGen,
}: CanvasProps) {
  const cellSize = 12;
  const gridGap = 2;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const gridGraphicRef = useRef<Graphics | null>(null);

  const speedRef = useRef<number>(speed[0]);
  const proceedGenRef = useRef(proceedGen);

  useEffect(() => {
    if (!wrapperRef.current) return;
    let destroyed = false;

    const app = new Application();

    // Setup PixiJS application and create graphics
    (async () => {
      await app.init({
        background: "#fafafa",
        resizeTo: wrapperRef.current!,
      });
      if (destroyed) return;

      appRef.current = app;

      wrapperRef.current?.appendChild(app.canvas);
      const container = new Container();
      app.stage.addChild(container);

      const gridGraphic: Graphics = clearAndDrawGridGraphic(
        new Graphics(),
        simulation.grid,
        cellSize,
        gridGap,
      );
      gridGraphicRef.current = gridGraphic;

      gridGraphic.pivot.x = gridGraphic.width / 2;
      gridGraphic.pivot.y = gridGraphic.height / 2;

      gridGraphic.x = app.screen.width / 2;
      gridGraphic.y = app.screen.height / 2;

      gridGraphic.eventMode = "static";
      gridGraphic.cursor = "pointer";

      gridGraphic.on("pointerdown", (e: FederatedPointerEvent) => {
        const position = e.getLocalPosition(gridGraphic);

        const col = Math.floor(position.x / (cellSize + gridGap));
        const row = Math.floor(position.y / (cellSize + gridGap));

        setSimulation((prevSimulation) => {
          const newGrid = prevSimulation.grid.map((r) => r.slice());
          if (newGrid[row] && newGrid[row][col] !== undefined) {
            newGrid[row][col] = newGrid[row][col] === 0 ? 1 : 0;
          }
          return { ...prevSimulation, grid: newGrid };
        });
      });

      container.addChild(gridGraphic);
    })();

    // Cleanup on unmount
    return () => {
      destroyed = true;
      appRef.current?.destroy(true, true);
    };
  }, []);

  useEffect(() => {
    if (!gridGraphicRef.current) return;
    clearAndDrawGridGraphic(
      gridGraphicRef.current,
      simulation.grid,
      cellSize,
      gridGap,
    );
  }, [simulation.grid]);

  const elapsedRef = useRef(0);
  const simTick = useCallback((ticker: Ticker) => {
    elapsedRef.current += ticker.deltaMS;
    const stepDuration = 1000 / speedRef.current;
    if (elapsedRef.current > stepDuration) {
      setSimulation((prevSimulation) => ({
        ...prevSimulation,
        grid: proceedGenRef.current(prevSimulation.grid),
        gen: prevSimulation.gen + 1,
      }));
      elapsedRef.current = 0;
    }
  }, []);

  useEffect(() => {
    if (!appRef.current) return;

    if (isPlaying) {
      appRef.current.ticker.add(simTick);
    } else {
      appRef.current.ticker.remove(simTick);
    }

    return () => {
      appRef.current?.ticker.remove(simTick);
    };
  }, [isPlaying, simTick]);

  useEffect(() => {
    speedRef.current = speed[0];
  }, [speed]);

  return (
    <div
      ref={wrapperRef}
      className="w-full h-full rounded-lg overflow-hidden"
    ></div>
  );
}
