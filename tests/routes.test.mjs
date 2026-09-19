import test from 'node:test';
import assert from 'node:assert/strict';
import { paths, floors, routeFromPath, nextMainFloor, previousMainFloor, isProfile } from '../src/navigation/routeConfig.ts';
import { GestureGate } from '../src/navigation/gesture.ts';
const sequence = ['lobby', 'about', 'ara', 'bendi', 'anais', 'bliss', 'booking'];

test('all direct paths and trailing-slash variants resolve correctly', () => {
  for (const [route, path] of Object.entries(paths)) {
    assert.equal(routeFromPath(path), route);
    assert.equal(routeFromPath(path + '/'), route);
    assert.ok(floors[route]);
  }
});
test('downward journey and next-floor prefetch order include every profile', () => {
  const visited = [];
  for (let route = 'lobby'; route !== null; route = nextMainFloor(route)) visited.push(route);
  assert.deepEqual(visited, sequence);
  assert.equal(nextMainFloor('booking'), null);
});
test('upward journey is the exact reverse sequence', () => {
  const visited = [];
  for (let route = 'booking'; route !== null; route = previousMainFloor(route)) visited.push(route);
  assert.deepEqual(visited, [...sequence].reverse());
  assert.equal(previousMainFloor('lobby'), null);
});
test('profiles retain their identities for direct navigation and About exits', () => {
  for (const route of ['ara', 'bendi', 'anais', 'bliss']) assert.equal(isProfile(route), true);
  for (const route of ['lobby', 'about', 'booking']) assert.equal(isProfile(route), false);
});
for (const direction of [1, -1]) {
  test(`momentum cannot skip any profile in direction ${direction}`, () => {
    const gate = new GestureGate();
    let route = direction === 1 ? 'lobby' : 'booking';
    const visited = [route];
    let now = 1000;
    for (let step = 0; step < 6; step++) {
      assert.equal(gate.input(direction * 100, now, false, true), true);
      route = direction === 1 ? nextMainFloor(route) : previousMainFloor(route);
      visited.push(route);
      gate.block(now + 1180);
      for (let tick = now + 20; tick < now + 4000; tick += 20) {
        assert.equal(gate.input(direction * 100, tick, tick < now + 1180, true), false);
      }
      now += 4500;
    }
    assert.deepEqual(visited, direction === 1 ? sequence : [...sequence].reverse());
  });
}
