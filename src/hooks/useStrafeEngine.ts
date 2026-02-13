import { useRef, useEffect, useState } from 'react';
import type { InputState, Line } from '../types';
import { ENGINE_CONFIG } from '../constants/config';


export const useStrafeEngine = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  inputs: React.RefObject<InputState>,
  scrollSpeed: number,
  isPaused: boolean
) => {
  const [syncP, setSyncP] = useState(0);
  const [totalLines, setTotalLines] = useState(0);

  /// Engine refs
  const lines = useRef<(Line | null)[]>(new Array(ENGINE_CONFIG.MAX_SIZE).fill(null));
  const head = useRef(0);
  const isBufferFull = useRef(false);
  const accumulator = useRef(0);
  const lastTime = useRef(performance.now());
  const numGreenLines = useRef(0);
  const numDrawnLines = useRef(0);
  const syncRef = useRef(0);

  /// resetting
  useEffect(() => {
    if (!isPaused) {
      lines.current.fill(null);
      head.current = 0;
      isBufferFull.current = false;
      numGreenLines.current = 0;
      numDrawnLines.current = 0;
      accumulator.current = 0;
      lastTime.current = performance.now();
      setTotalLines(0);
      setSyncP(0);
    }
  }, [isPaused]);

  useEffect(() => {
    if (isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas || !inputs.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const updateLogic = () => {
      const { isKeyDownA, isKeyDownD, isLeft, isRight, mouseX } = inputs.current!;
      
      let color = '#333';
      if (((isKeyDownA && isLeft) || (isKeyDownD && isRight)) && !(isKeyDownA && isKeyDownD)) {
        color = '#0f0';
      }

      const currentHead = head.current;
      if (lines.current[currentHead]?.color === '#0f0') {
        numGreenLines.current--;
      }

      lines.current[currentHead] = {
        x: (canvas.width / 2.6) + (mouseX / 4),
        color: color,
      };

      if (color === '#0f0') numGreenLines.current++;

      numDrawnLines.current++;
      head.current = (currentHead + 1) % ENGINE_CONFIG.MAX_SIZE;
      if (head.current === 0) isBufferFull.current = true;

      const total = isBufferFull.current ? ENGINE_CONFIG.MAX_SIZE : head.current;
      const newSync = total > 0 ? Math.round((numGreenLines.current / total) * 100) : 0;
      
      if (newSync !== syncRef.current) {
        syncRef.current = newSync;
        setSyncP(newSync);
      }

      /// update total lines every 10 ticks for the sync% calc
      if (numDrawnLines.current % 10 === 0) {
        setTotalLines(numDrawnLines.current);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /// drawing grid----------
      const gridSize = 60;

      const scrollOffset = (numDrawnLines.current * scrollSpeed) % gridSize;
          
      ctx.save();
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.08)';
      ctx.lineWidth = 1;
          
      /// Vertical static lines
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      /// Horizontal moving lines
      for (let y = scrollOffset; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();

      /// ---- end of grid drawing

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    
      const total = isBufferFull.current ? ENGINE_CONFIG.MAX_SIZE : head.current;
      const start = isBufferFull.current ? head.current : 0;
    
      for (let i = 1; i < total; i++) {
        const prevIdx = (start + i - 1) % ENGINE_CONFIG.MAX_SIZE;
        const currIdx = (start + i) % ENGINE_CONFIG.MAX_SIZE;
        const prev = lines.current[prevIdx];
        const curr = lines.current[currIdx];
    
        if (!prev || !curr) continue;
    
        const yPos = (canvas.height / 8) + ((total - i) * scrollSpeed);
        const prevYPos = (canvas.height / 8) + ((total - (i - 1)) * scrollSpeed);
    
        const widthProgress = i / total; 
        const thicknessFactor = Math.pow(1 - widthProgress, 0.1);
        ctx.lineWidth = Math.max(25, 70 * thicknessFactor);
        
        ctx.beginPath();
        ctx.strokeStyle = curr.color;
        ctx.moveTo(prev.x, prevYPos);
        ctx.lineTo(curr.x, yPos);
        ctx.stroke();
      }
    };

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime.current;
      lastTime.current = currentTime;
      accumulator.current += deltaTime;

      while (accumulator.current >= ENGINE_CONFIG.TICK_RATE) {
        updateLogic();
        accumulator.current -= ENGINE_CONFIG.TICK_RATE;
      }

      draw();
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, scrollSpeed, canvasRef, inputs]);

  return { syncP, totalLines };
};