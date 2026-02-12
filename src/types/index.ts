export interface InputState {
    isKeyDownA: boolean;
    isKeyDownD: boolean;
    isLeft: boolean;
    isRight: boolean;
    mouseX: number;
  }
  
export interface Line {
    x: number;
    color: string;
  }

export interface HUDProps {
    syncP: number;
    scrollSpeed: number;
    onSpeedChange: (amt: number) => void;
  }