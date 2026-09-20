// A phase completes once, and only when both physical doors reach its endpoint.
export const DOOR_CLOSE_SECONDS = 0.325;
export const DOOR_OPEN_SECONDS = 0.325;
export class DoorMotion {
  private phase = "idle";
  private completed = false;
  private positions = { left: 0, right: 0 };
  constructor(initiallyOpen = false) {
    if (initiallyOpen) this.positions = { left: -102, right: 102 };
  }
  setPhase(phase: string) {
    if (phase !== this.phase) { this.phase = phase; this.completed = false; }
  }
  update(side: "left" | "right", position: number) { this.positions[side] = position; }
  finish(): "closing" | "opening" | undefined {
    const phase = this.phase;
    if (this.completed || (phase !== "closing" && phase !== "opening")) return;
    const offset = phase === "closing" ? 0 : 102;
    if (Math.abs(this.positions.left + offset) > 0.001 || Math.abs(this.positions.right - offset) > 0.001) return;
    this.completed = true;
    return phase;
  }
}
