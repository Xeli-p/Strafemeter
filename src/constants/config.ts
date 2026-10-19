export const ENGINE_CONFIG = {
  MAX_SIZE: 500,
  TICK_RATE: 1000 / 240,
  /// Cap on frame delta so a backgrounded tab doesn't replay seconds of stale input
  MAX_FRAME_MS: 100,
  DEFAULT_SPEED: 3,
  MIN_SPEED: 0.5,
  MAX_SPEED: 10,
  SPEED_STEP: 0.5,
  LINE_WIDTH: 70,
  /// How far the trail moves horizontally per pixel of mouse movement
  LINE_X_SCALE: 0.25,
  /// Mouse direction resets to none if no movement arrives within this time
  MOVE_STALE_MS: 30,
  /// Rolling window used for strafes/sec
  SPS_WINDOW_MS: 2000,
  SYNCED_COLOR: '#0f0',
  UNSYNCED_COLOR: '#333',
};
