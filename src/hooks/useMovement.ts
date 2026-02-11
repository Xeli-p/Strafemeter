import { useEffect, useRef } from 'react';
import type { InputState } from '../types';


  export const useMovement = () => {

    const inputs = useRef<InputState>({
      isKeyDownA: false,
      isKeyDownD: false,
      isLeft: false,
      isRight: false,
      mouseX: 1000,
    });
  
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (key === 'a') inputs.current.isKeyDownA = true;
        if (key === 'd') inputs.current.isKeyDownD = true;
      };
  
      const handleKeyUp = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (key === 'a') inputs.current.isKeyDownA = false;
        if (key === 'd') inputs.current.isKeyDownD = false;
      };
  
      const handleMouseMove = (e: MouseEvent) => {
        const currentX = e.clientX;
        const prevX = inputs.current.mouseX;
  
        if (currentX < prevX) {
          inputs.current.isLeft = true;
          inputs.current.isRight = false;
        } else if (currentX > prevX) {
          inputs.current.isRight = true;
          inputs.current.isLeft = false;
        } else {
          inputs.current.isLeft = false;
          inputs.current.isRight = false;
        }
  
        inputs.current.mouseX = currentX;
      };
  
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('mousemove', handleMouseMove);
  
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }, []);
  
    return inputs;
  };