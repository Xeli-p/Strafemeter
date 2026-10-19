import React, { useRef, useEffect, useState } from 'react';
import { useMovement } from '../hooks/useMovement';
import { useStrafeEngine } from '../hooks/useStrafeEngine';
import { ENGINE_CONFIG } from '../constants/config';
import HUD from './UI/HUD';

/// Pointer lock hides the cursor and keeps it from hitting the screen edge.
/// If it's refused the meter still works, since movementX is reported anyway.
const lockPointer = (canvas: HTMLCanvasElement | null) => {
  if (!canvas || document.pointerLockElement === canvas) return;
  Promise.resolve(canvas.requestPointerLock()).catch(() => {});
};

const StrafeMeter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputs = useMovement();

  const [isPaused, setIsPaused] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(ENGINE_CONFIG.DEFAULT_SPEED);

  /// Engine hook
  const { syncP, sps, reset } = useStrafeEngine(canvasRef, inputs, scrollSpeed, isPaused);

  const handleSpeedChange = (amt: number) => {
    setScrollSpeed((prev) => {
      const newSpeed = Math.round((prev + amt) * 10) / 10;
      return Math.min(Math.max(ENGINE_CONFIG.MIN_SPEED, newSpeed), ENGINE_CONFIG.MAX_SPEED);
    });
  };

  /// Resizing, with the backing store scaled for HiDPI screens
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = Math.round(window.innerWidth * dpr);
        canvasRef.current.height = Math.round(window.innerHeight * dpr);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /// Losing pointer lock (Esc) pauses the session
  useEffect(() => {
    const handleLockChange = () => {
      if (document.pointerLockElement !== canvasRef.current) setIsPaused(true);
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []);

  /// Keyboard controls
  useEffect(() => {
    const resume = () => {
      setIsPaused(false);
      lockPointer(canvasRef.current);
    };

    const pause = () => {
      setIsPaused(true);
      if (document.pointerLockElement) document.exitPointerLock();
    };

    const restart = () => {
      reset();
      setHasStarted(true);
      resume();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        /// Stops page scroll and activation of a focused button
        e.preventDefault();
        if (e.repeat) return;
        if (!hasStarted) restart();
        else if (isPaused) resume();
        else pause();
      } else if (e.code === 'KeyR' && !e.repeat) {
        restart();
      } else if (e.code === 'Escape' && !isPaused) {
        pause();
      } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        handleSpeedChange(-ENGINE_CONFIG.SPEED_STEP);
      } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        handleSpeedChange(ENGINE_CONFIG.SPEED_STEP);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, hasStarted, reset]);

  return (
    <div className="relative w-screen h-screen bg-neutral-950 overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={() => !isPaused && lockPointer(canvasRef.current)}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair block"
      />

      {!isPaused && (
        <HUD
          syncP={syncP}
          scrollSpeed={scrollSpeed}
          onSpeedChange={handleSpeedChange}
          sps={sps}
        />
      )}

      {isPaused && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md">
          <h2 className="text-yellow-500 text-7xl font-black italic tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">
            {hasStarted ? 'PAUSED' : 'STRAFE SYNC'}
          </h2>
          <p className="text-yellow-500/60 font-mono animate-pulse uppercase tracking-[0.3em]">
            {hasStarted ? 'Space to Resume • R to Restart' : 'Press Space to Start'}
          </p>
          <div className="mt-12 flex gap-8 text-[15px] text-yellow-500/60 uppercase font-mono">
            <span>A / D + Mouse Move</span>
            <span>•</span>
            <span>Match Movement to Keys</span>
            <span>•</span>
            <span>Esc to Pause</span>
            <span>•</span>
            <span>- / + Speed</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrafeMeter;
