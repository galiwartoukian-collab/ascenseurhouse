// Independent of rendering so momentum/threshold behavior can be regression-tested.
export class GestureGate {
  lastInput = -Infinity;
  blockedUntil = 0;
  amount = 0;
  direction = 0;
  suppressed = false;
  private touchActive = false;
  private touchCanExitUp = false;

  beginTouch(now: number, atTop: boolean) {
    this.touchActive = true;
    this.touchCanExitUp = atTop && now - this.lastInput > 260 && now >= this.blockedUntil;
  }

  endTouch(now: number) {
    this.touchActive = false;
    this.touchCanExitUp = false;
    this.lastInput = now;
  }

  arriveAtTop(now: number) {
    // Consume this gesture, not native scrolling. No timer or scrollTo is needed.
    this.lastInput = now;
    this.amount = 0;
    this.suppressed = true;
    this.touchCanExitUp = false;
  }


  block(now: number, duration = 900) {
    this.blockedUntil = now + duration;
    this.amount = 0;
    this.suppressed = true;
  }

  input(delta: number, now: number, locked: boolean, atEdge: boolean): boolean {
    const quiet = now - this.lastInput > 260;
    this.lastInput = now;
    if (locked || now < this.blockedUntil) {
      this.suppressed = true;
      this.amount = 0;
      return false;
    }
    // A route change requires a NEW gesture, not the tail of the old one.
    if (this.suppressed && !quiet) return false;
    if (quiet) { this.suppressed = false; this.amount = 0; }
    if (!atEdge || (delta < 0 && this.touchActive && !this.touchCanExitUp)) { this.amount = 0; return false; }
    const direction = Math.sign(delta);
    if (direction !== this.direction) this.amount = 0;
    this.direction = direction;
    this.amount += Math.min(Math.abs(delta), 120);
    if (this.amount < 90) return false;
    this.block(now);
    return true;
  }
}

// One instance per actual scroll container; never compare desktop and mobile offsets.
export class ScrollBoundary {
  top: number;
  distance = 0;

  constructor(top: number) { this.top = Math.max(0, top); }

  observe(top: number, now: number, gate: GestureGate) {
    const next = Math.max(0, top);
    const delta = next - this.top;
    if (delta === 0) return 0;
    if (this.top > 0 && next === 0) gate.arriveAtTop(now);
    this.top = next;
    if (Math.sign(delta) !== Math.sign(this.distance)) this.distance = 0;
    this.distance += delta;
    return delta;
  }

  atEdge(delta: number, height: number, total: number) {
    // A positive fractional offset still means there is content above the page.
    return delta < 0 ? this.top === 0 : delta > 0 && this.top + height >= total - 3;
  }
}
