export interface InputState {
  isKeyDownA: boolean;
  isKeyDownD: boolean;
  isLeft: boolean;
  isRight: boolean;
  /// Virtual cursor position, accumulated from movementX and clamped to the window
  mouseX: number;
}

export interface Line {
  x: number;
  synced: boolean;
}

export interface HUDProps {
  syncP: number;
  scrollSpeed: number;
  onSpeedChange: (amt: number) => void;
  sps: number;
}
