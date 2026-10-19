import { useEffect, useRef } from 'react';
import type { InputState } from '../types';
import { ENGINE_CONFIG } from '../constants/config';

export const useMovement = () => {
  const inputs = useRef<InputState>({
    isKeyDownA: false,
    isKeyDownD: false,
    isLeft: false,
    isRight: false,
    mouseX: 0,
  });

  const lastMoveTime = useRef(0);

  useEffect(() => {
    inputs.current.mouseX = window.innerWidth / 2;

    /// event.code is layout independent and unaffected by Shift
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyA') inputs.current.isKeyDownA = true;
      if (event.code === 'KeyD') inputs.current.isKeyDownD = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'KeyA') inputs.current.isKeyDownA = false;
      if (event.code === 'KeyD') inputs.current.isKeyDownD = false;
    };

    /// keyup never arrives if the window loses focus while a key is held
    const handleBlur = () => {
      inputs.current.isKeyDownA = false;
      inputs.current.isKeyDownD = false;
      inputs.current.isLeft = false;
      inputs.current.isRight = false;
    };

    /// movementX keeps reporting at the screen edge and under pointer lock, unlike clientX
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.movementX;
      lastMoveTime.current = performance.now();

      inputs.current.isLeft = dx < 0;
      inputs.current.isRight = dx > 0;
      inputs.current.mouseX = Math.min(Math.max(0, inputs.current.mouseX + dx), window.innerWidth);
    };

    let rafId: number;
    const checkMovementStale = () => {
      const now = performance.now();
      if (now - lastMoveTime.current > ENGINE_CONFIG.MOVE_STALE_MS) {
        inputs.current.isLeft = false;
        inputs.current.isRight = false;
      }
      rafId = requestAnimationFrame(checkMovementStale);
    };
    rafId = requestAnimationFrame(checkMovementStale);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return inputs;
};
