import React, { useRef, useEffect, useState } from 'react';
import { useMovement } from '../hooks/useMovement';
import HUD from './UI/HUD';
import type { InputState, Line } from '../types';

const maxSize = 500;
const tickRate = 1000 / 240;

const StrafeMeter: React.FC = () => {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputs = useMovement() as React.RefObject<InputState>;
  
  const lines = useRef<(Line | null)[]>(new Array(maxSize).fill(null));
  const head = useRef(0);
  const isBufferFull = useRef(false);
  const accumulator = useRef(0);
  const lastTime = useRef(performance.now());
  const numGreenLines = useRef(0);
  const numDrawnLines = useRef(0);
  const syncRef = useRef(0);
  
  const [syncP, setSyncP] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [scrollSpeed, setScrollSpeed] = useState(3);

  const handleSpeedChange = (amt: number) => {
    setScrollSpeed((prev) => {
      const newSpeed = Math.round((prev + amt) * 10) / 10;
      return Math.min(Math.max(0.5, newSpeed), 10);
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPaused((prev) => !prev);
        if (isPaused) {
          lines.current.fill(null);
          head.current = 0;
          isBufferFull.current = false;
          numGreenLines.current = 0;
          numDrawnLines.current = 0;
          accumulator.current = 0;
          lastTime.current = performance.now();
        }
      }
    };
    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, [isPaused]);

  // Game engine
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
      head.current = (currentHead + 1) % maxSize;
      if (head.current === 0) isBufferFull.current = true;

      const total = isBufferFull.current ? maxSize : head.current;
      const newSync = total > 0 ? Math.round((numGreenLines.current / total) * 100) : 0;
      
      if (newSync !== syncRef.current) {
          syncRef.current = newSync;
          setSyncP(newSync);
      }

    };

    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      
        const total = isBufferFull.current ? maxSize : head.current;
        const start = isBufferFull.current ? head.current : 0;
      
        for (let i = 1; i < total; i++) {
          const prevIdx = (start + i - 1) % maxSize;
          const currIdx = (start + i) % maxSize;
          const prev = lines.current[prevIdx];
          const curr = lines.current[currIdx];
      
          if (!prev || !curr) continue;
      
          const yPos = (canvas.height / 8) + ((total - i) * scrollSpeed);
          const prevYPos = (canvas.height / 8) + ((total - (i - 1)) * scrollSpeed);
      
          const widthProgress = i / total; 
          const thicknessFactor = Math.pow(1 - widthProgress, 0.1);
          ctx.lineWidth = Math.max(25, 70 * thicknessFactor);
          ctx.globalAlpha = 1;
          
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

      while (accumulator.current >= tickRate) {
        updateLogic();
        accumulator.current -= tickRate;
      }

      draw();
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, scrollSpeed]);

  return (
    <div className="relative w-screen h-screen bg-neutral-950 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair block"
      />
  
      {!isPaused && (
        /// HUD
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
          <HUD 
            syncP={syncP} 
            scrollSpeed={scrollSpeed} 
            onSpeedChange={handleSpeedChange} 
          />
        </div>
      )}
  
      {isPaused && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md">
          <h2 className="text-yellow-500 text-7xl font-black italic tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">
            STRAFE SYNC
          </h2>
          <p className="text-yellow-500/60 font-mono animate-pulse uppercase tracking-[0.3em]">
            Press Space to Initialize
          </p>
          
          <div className="mt-12 flex gap-8 text-[15px] text-yellow-500/60 uppercase font-mono">
            <span>A / D + Mouse Move</span>
            <span>•</span>
            <span>Match Movement to Keys</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrafeMeter;