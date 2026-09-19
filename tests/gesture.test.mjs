import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureGate } from '../src/navigation/gesture.ts';

test('tiny movements and ordinary scrolling cannot navigate', () => {
  const gate = new GestureGate();
  assert.equal(gate.input(500, 0, false, false), false);
  assert.equal(gate.input(20, 20, false, true), false);
  assert.equal(gate.input(20, 40, false, true), false);
  assert.equal(gate.input(20, 60, false, true), false);
});
test('one wheel gesture can trigger only one navigation', () => {
  const gate = new GestureGate();
  assert.equal(gate.input(50, 0, false, true), false);
  assert.equal(gate.input(50, 20, false, true), true);
  for (let now = 40; now < 4000; now += 20) assert.equal(gate.input(100, now, false, true), false);
  assert.equal(gate.input(50, 4400, false, true), false);
  assert.equal(gate.input(50, 4420, false, true), true);
});
test('arrival cooldown requires idle time even after cooldown expires', () => {
  const gate = new GestureGate();
  gate.block(0);
  for (let now = 0; now < 2000; now += 100) assert.equal(gate.input(-50, now, false, true), false);
  assert.equal(gate.input(-50, 2400, false, true), false);
  assert.equal(gate.input(-50, 2420, false, true), true);
});
test('direction reversal resets the threshold and transition locks reject input', () => {
  const gate = new GestureGate();
  assert.equal(gate.input(60, 0, false, true), false);
  assert.equal(gate.input(-60, 20, false, true), false);
  assert.equal(gate.input(-60, 40, true, true), false);
  assert.equal(gate.input(-60, 60, false, true), false);
});
test('leaving the page edge resets accumulated intent', () => {
  const gate = new GestureGate();
  gate.input(60, 0, false, true);
  gate.input(60, 20, false, false);
  assert.equal(gate.input(40, 40, false, true), false);
});
test('arriving at the top consumes upward momentum until a fresh gesture', () => {
  const gate = new GestureGate();
  gate.input(-120, 0, false, false);
  gate.block(20, 260);
  for (let now = 40; now < 1000; now += 20) assert.equal(gate.input(-120, now, false, true), false);
  assert.equal(gate.input(-100, 1400, false, true), true);
});
