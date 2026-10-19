import { useRef, useEffect, useState } from 'react';
import type { InputState, Line } from '../types';
import { ENGINE_CONFIG } from '../constants/config';

type Direction = 'left' | 'right';

const SPS_WINDOW_TICKS = Math.round(ENGINE_CONFIG.SPS_WINDOW_MS / ENGINE_CONFIG.TICK_RATE);

export const useStrafeEngine = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  inputs: React.RefObject<InputState>,
  scrollSpeed: number,
  isPaused: boolean
) => {
  const [syncP, setSyncP] = useState(0);
  const [sps, setSps] = useState(0);

  /// Engine refs
  const lines = useRef<(Line | null)[]>(new Array(ENGINE_CONFIG.MAX_SIZE).fill(null));
  const head = useRef(0);
  const isBufferFull = useRef(false);
  const accumulator = useRef(0);
  const numSyncedLines = useRef(0);
  const numDrawnLines = useRef(0);
  const syncRef = useRef(0);
  const spsRef = useRef(0);
  /// Tick index of each strafe inside the rolling SPS window, oldest first
  const strafeTicks = useRef<number[]>([]);
  const lastDirection = useRef<Direction | null>(null);

  /// Called from event handlers to start a fresh session
  const reset = () => {
    lines.current.fill(null);
    head.current = 0;
    isBufferFull.current = false;
    numSyncedLines.current = 0;
    numDrawnLines.current = 0;
    accumulator.current = 0;
    syncRef.current = 0;
    spsRef.current = 0;
    strafeTicks.current = [];
    lastDirection.current = null;
    setSyncP(0);
    setSps(0);
  };

  useEffect(() => {
    if (isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas || !inputs.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const updateLogic = (width: number) => {
      const { isKeyDownA, isKeyDownD, isLeft, isRight, mouseX } = inputs.current!;

      const synced = ((isKeyDownA && isLeft) || (isKeyDownD && isRight)) && !(isKeyDownA && isKeyDownD);

      /// A strafe is a switch between A and D, so mouse jitter doesn't count
      let keyDir: Direction | null = null;
      if (isKeyDownA && !isKeyDownD) keyDir = 'left';
      if (isKeyDownD && !isKeyDownA) keyDir = 'right';

      if (keyDir) {
        if (lastDirection.current && keyDir !== lastDirection.current) {
          strafeTicks.current.push(numDrawnLines.current);
        }
        lastDirection.current = keyDir;
      }

      const currentHead = head.current;
      if (lines.current[currentHead]?.synced) {
        numSyncedLines.current--;
      }

      lines.current[currentHead] = {
        x: width / 2 + (mouseX - window.innerWidth / 2) * ENGINE_CONFIG.LINE_X_SCALE,
        synced,
      };

      if (synced) numSyncedLines.current++;

      numDrawnLines.current++;
      head.current = (currentHead + 1) % ENGINE_CONFIG.MAX_SIZE;
      if (head.current === 0) isBufferFull.current = true;

      const total = isBufferFull.current ? ENGINE_CONFIG.MAX_SIZE : head.current;
      const newSync = total > 0 ? Math.round((numSyncedLines.current / total) * 100) : 0;

      if (newSync !== syncRef.current) {
        syncRef.current = newSync;
        setSyncP(newSync);
      }

      /// Rolling strafes/sec, refreshed every 10 ticks
      if (numDrawnLines.current % 10 === 0) {
        const windowStart = numDrawnLines.current - SPS_WINDOW_TICKS;
        while (strafeTicks.current.length && strafeTicks.current[0] < windowStart) {
          strafeTicks.current.shift();
        }

        const windowTicks = Math.min(numDrawnLines.current, SPS_WINDOW_TICKS);
        const windowSeconds = (windowTicks * ENGINE_CONFIG.TICK_RATE) / 1000;
        const newSps = Math.round((strafeTicks.current.length / windowSeconds) * 10) / 10;

        if (newSps !== spsRef.current) {
          spsRef.current = newSps;
          setSps(newSps);
        }
      }
    };

    const draw = (width: number, height: number, dpr: number) => {
      /// Draw in CSS pixels; the backing store is scaled by devicePixelRatio
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      /// drawing grid----------
      const gridSize = 60;

      const scrollOffset = (numDrawnLines.current * scrollSpeed) % gridSize;

      ctx.strokeStyle = 'rgba(234, 179, 8, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();

      /// Vertical static lines
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }

      /// Horizontal moving lines
      for (let y = scrollOffset; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      /// ---- end of grid drawing

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = ENGINE_CONFIG.LINE_WIDTH;

      const total = isBufferFull.current ? ENGINE_CONFIG.MAX_SIZE : head.current;
      const start = isBufferFull.current ? head.current : 0;

      /// Consecutive segments of the same colour are stroked as one path
      let runSynced: boolean | null = null;

      for (let i = 1; i < total; i++) {
        const prev = lines.current[(start + i - 1) % ENGINE_CONFIG.MAX_SIZE];
        const curr = lines.current[(start + i) % ENGINE_CONFIG.MAX_SIZE];

        if (!prev || !curr) {
          if (runSynced !== null) ctx.stroke();
          runSynced = null;
          continue;
        }

        const yPos = (height / 8) + ((total - i) * scrollSpeed);
        const prevYPos = yPos + scrollSpeed;

        if (curr.synced !== runSynced) {
          if (runSynced !== null) ctx.stroke();
          runSynced = curr.synced;
          ctx.beginPath();
          ctx.strokeStyle = curr.synced ? ENGINE_CONFIG.SYNCED_COLOR : ENGINE_CONFIG.UNSYNCED_COLOR;
          ctx.moveTo(prev.x, prevYPos);
        }
        ctx.lineTo(curr.x, yPos);
      }
      if (runSynced !== null) ctx.stroke();
    };

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      accumulator.current += Math.min(Math.max(0, deltaTime), ENGINE_CONFIG.MAX_FRAME_MS);

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      while (accumulator.current >= ENGINE_CONFIG.TICK_RATE) {
        updateLogic(width);
        accumulator.current -= ENGINE_CONFIG.TICK_RATE;
      }

      draw(width, height, dpr);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, scrollSpeed, canvasRef, inputs]);

  return { syncP, sps, reset };
};
