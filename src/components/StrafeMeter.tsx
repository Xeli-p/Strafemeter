import React, { useRef, useEffect, useState } from 'react';
import { useMovement } from '../hooks/useMovement';
import { useStrafeEngine } from '../hooks/useStrafeEngine';
import HUD from './UI/HUD';
import type { InputState } from '../types';

const StrafeMeter: React.FC = () => {
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputs = useMovement() as React.RefObject<InputState>;
  
  const [isPaused, setIsPaused] = useState(true);
  const [scrollSpeed, setScrollSpeed] = useState(3);

  /// Engine hook
  const { syncP } = useStrafeEngine(canvasRef, inputs, scrollSpeed, isPaused);

  const handleSpeedChange = (amt: number) => {
    setScrollSpeed((prev) => {
      const newSpeed = Math.round((prev + amt) * 10) / 10;
      return Math.min(Math.max(0.5, newSpeed), 10);
    });
  };

  /// Resizing
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

  /// Keyboard listener
  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsPaused((prev) => !prev);
    };
    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-neutral-950 overflow-hidden">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full cursor-crosshair block" />

      {!isPaused && (
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