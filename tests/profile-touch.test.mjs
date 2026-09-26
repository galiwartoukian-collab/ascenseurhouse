import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileTouchGate } from '../src/navigation/gesture.ts';
import { nextMainFloor, previousMainFloor } from '../src/navigation/routeConfig.ts';

for (const [route, previous, next] of [
  ['ara', 'about', 'bendi'], ['bendi', 'ara', 'anais'],
  ['anais', 'bendi', 'bliss'], ['bliss', 'anais', 'booking'],
]) {
  for (const direction of [-1, 1]) {
    test(`${route}: ${direction > 0 ? 'next' : 'previous'} floor requires release and a new boundary swipe`, () => {
      const gate = new ProfileTouchGate();
      const edge = direction > 0 ? 1000 : 0;
      gate.begin(500, 700, 1700);
      for (const delta of [10, 50, 500]) {
        assert.equal(gate.input(direction * delta, 500, 700, 1700, false), false);
      }
      // Reaching the edge and continuing the same gesture never authorizes exit.
      for (let i = 0; i < 20; i++) assert.equal(gate.input(direction * 120, edge, 700, 1700, false), false);
      gate.end();
      // Released touches / momentum cannot navigate either.
      assert.equal(gate.input(direction * 120, edge, 700, 1700, false), false);
      gate.begin(edge, 700, 1700);
      assert.equal(gate.input(direction * 30, edge, 700, 1700, false), false);
      assert.equal(gate.input(direction * 59, edge, 700, 1700, false), false);
      assert.equal(gate.input(direction, edge, 700, 1700, false), true);
      assert.equal(direction > 0 ? nextMainFloor(route) : previousMainFloor(route), direction > 0 ? next : previous);
      assert.equal(gate.input(direction * 120, edge, 700, 1700, false), false);
    });
  }
}

test('even fractional remaining content disqualifies the entire gesture', () => {
  for (const [start, edge, delta] of [[999.99, 1000, 120], [0.01, 0, -120]]) {
    const gate = new ProfileTouchGate();
    gate.begin(start, 700, 1700);
    assert.equal(gate.input(delta, edge, 700, 1700, false), false);
  }
});

test('small separate gestures never accumulate, but a fresh hard swipe works', () => {
  const gate = new ProfileTouchGate();
  for (let i = 0; i < 5; i++) {
    gate.begin(1000, 700, 1700);
    assert.equal(gate.input(25, 1000, 700, 1700, false), false);
    gate.end();
  }
  gate.begin(1000, 700, 1700);
  assert.equal(gate.input(0, 1000, 700, 1700, false), false);
  assert.equal(gate.input(120, 1000, 700, 1700, false), true);
});

test('leaving an edge or starting during a transition consumes the touch', () => {
  for (const locked of [false, true]) {
    const gate = new ProfileTouchGate();
    gate.begin(1000, 700, 1700);
    assert.equal(gate.input(50, locked ? 1000 : 900, 700, 1700, locked), false);
    assert.equal(gate.input(120, 1000, 700, 1700, false), false);
  }
});
