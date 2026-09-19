import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureGate, ScrollBoundary } from '../src/navigation/gesture.ts';
import { nextMainFloor, previousMainFloor } from '../src/navigation/routeConfig.ts';

function booking(top = 200) {
  const gate = new GestureGate();
  const boundary = new ScrollBoundary(top);
  return {
    gate, boundary,
    scroll(top, now) { boundary.observe(top, now, gate); },
    wheel(delta, now, eligible = true, locked = false) {
      const destination = delta < 0 ? previousMainFloor('booking') : nextMainFloor('booking');
      const accepted = gate.input(delta, now, locked, boundary.atEdge(delta, 650, 938) && eligible && destination !== null);
      // This is also the hook's preventDefault condition: only an accepted navigation.
      return accepted ? destination : null;
    },
  };
}

test('Booking never intercepts upward input with any positive scrollTop', () => {
  const page = booking();
  for (const [index, top] of [200, 100, 3, 2, 0.5, 0.01].entries()) {
    page.scroll(top, index * 1000);
    assert.equal(page.wheel(-500, index * 1000 + 10), null);
  }
});
test('a large swipe reaches zero without exiting, then a fresh gesture returns to Bliss', () => {
  const page = booking();
  assert.equal(page.wheel(-500, 0), null);
  page.scroll(0, 10);
  for (let now = 20; now < 1500; now += 20) assert.equal(page.wheel(-120, now), null);
  assert.equal(page.wheel(-100, 1900), 'bliss');
});
test('edge is synchronized even if final scroll notification has not arrived', () => {
  const page = booking(2);
  // The next wheel sees zero before the queued native scroll callback runs.
  page.boundary.observe(0, 1000, page.gate);
  assert.equal(page.wheel(-120, 1000), null);
  page.scroll(0, 1010);
  assert.equal(page.wheel(-100, 1400), 'bliss');
});
test('momentum over form controls cannot create a false quiet period', () => {
  const page = booking();
  page.scroll(0, 0);
  for (let now = 20; now < 1200; now += 20) assert.equal(page.wheel(-100, now, false), null);
  assert.equal(page.wheel(-100, 1200), null);
  assert.equal(page.wheel(-100, 1600), 'bliss');
});
test('pausing with a finger still down does not make it a new upward gesture', () => {
  const page = booking();
  page.gate.beginTouch(0, false);
  assert.equal(page.wheel(-300, 10), null);
  page.scroll(0, 20);
  assert.equal(page.wheel(-120, 1000), null);
  assert.equal(page.wheel(-120, 2000), null);
  page.gate.endTouch(2100);
  page.gate.beginTouch(2500, true);
  assert.equal(page.wheel(-100, 2510), 'bliss');
});
test('touch momentum after release stays on Booking', () => {
  const page = booking();
  page.gate.beginTouch(0, false);
  page.gate.endTouch(100);
  page.scroll(40, 120);
  page.scroll(0, 140);
  for (let now = 160; now < 1000; now += 20) assert.equal(page.wheel(-100, now), null);
  page.gate.beginTouch(1400, true);
  assert.equal(page.wheel(-100, 1410), 'bliss');
});
test('repeated direction changes never prevent native scroll inside Booking', () => {
  const page = booking();
  let now = 0;
  for (let cycle = 0; cycle < 10; cycle++) {
    for (const top of [100, 0, 100, 250, 288, 200]) {
      const delta = top - page.boundary.top;
      assert.equal(page.wheel(delta, now), null);
      page.scroll(top, now + 5);
      now += 30;
    }
  }
});
test('bottom of final Booking never navigates and arrival lock is not shortened', () => {
  const page = booking(288);
  assert.equal(page.wheel(500, 1000), null);
  page.gate.block(1100);
  page.scroll(0, 1200);
  assert.equal(page.gate.blockedUntil, 2000);
  assert.equal(page.wheel(-100, 1600), null);
  assert.equal(page.wheel(-100, 2400), 'bliss');
});
test('desktop and mobile containers keep independent position history', () => {
  const gate = new GestureGate();
  const desktop = new ScrollBoundary(0);
  const mobile = new ScrollBoundary(150);
  assert.equal(desktop.observe(0, 0, gate), 0);
  assert.equal(mobile.observe(140, 10, gate), -10);
  assert.equal(mobile.atEdge(-100, 650, 938), false);
  assert.equal(gate.suppressed, false);
});
