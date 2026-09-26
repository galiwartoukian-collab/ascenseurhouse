import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileTouchGate } from '../src/navigation/gesture.ts';

for (const direction of [-1, 1]) {
  test(`direction ${direction}: middle-to-edge gesture cannot navigate on release`, () => {
    const gate = new ProfileTouchGate();
    const edge = direction > 0 ? 1000 : 0;
    gate.begin(500, 500, 700, 1700);
    assert.equal(gate.finish(500 - direction * 300, edge, 700, 1700, false), 0);
    gate.begin(500, edge, 700, 1700);
    assert.equal(gate.finish(500 - direction * 90, edge, 700, 1700, false), direction);
    assert.equal(gate.finish(500 - direction * 300, edge, 700, 1700, false), 0);
  });
  test(`direction ${direction}: browser rounding allows at most 3px`, () => {
    for (const gap of [0, 2.9, 3, 3.1, 4]) {
      const gate = new ProfileTouchGate();
      const top = direction > 0 ? 1000 - gap : gap;
      gate.begin(500, top, 700, 1700);
      assert.equal(gate.finish(500 - direction * 100, top, 700, 1700, false), gap <= 3 ? direction : 0);
    }
  });
}
test('short gestures never accumulate across releases', () => {
  const gate = new ProfileTouchGate();
  for (let i = 0; i < 5; i++) {
    gate.begin(500, 1000, 700, 1700);
    assert.equal(gate.finish(411, 1000, 700, 1700, false), 0);
  }
});
test('cancel, transition lock, and a resized viewport with content below reject exit', () => {
  const gate = new ProfileTouchGate();
  gate.begin(500, 1000, 700, 1700);
  gate.cancel();
  assert.equal(gate.finish(100, 1000, 700, 1700, false), 0);
  gate.begin(500, 1000, 700, 1700);
  assert.equal(gate.finish(100, 1000, 700, 1700, true), 0);
  gate.begin(500, 1000, 700, 1700);
  assert.equal(gate.finish(100, 1000, 600, 1700, false), 0);
});
test('fitting content is not accepted as a scroll owner', () => {
  const gate = new ProfileTouchGate();
  gate.begin(500, 0, 700, 700);
  assert.equal(gate.finish(100, 0, 700, 700, false), 0);
});
