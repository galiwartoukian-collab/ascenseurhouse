import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouteLoader, DoorTransition } from '../src/navigation/routeLoader.ts';

test('route readiness never waits for image load or decode', async () => {
  let calls = 0;
  const warmed = [];
  const module = { default: () => null, assets: ['large-header.jpg', 'portrait.jpg'] };
  const load = createRouteLoader(async () => { calls++; return module; }, src => {
    warmed.push(src);
    return new Promise(() => {}); // Image never finishes; route must still resolve.
  });
  const first = load();
  assert.equal(load(), first, 'prefetch and React.lazy share the same promise');
  assert.equal(await first, module);
  assert.deepEqual(warmed, module.assets);
  assert.equal(calls, 1);
});
test('optional media failure does not prevent mounting the route', async () => {
  const module = { default: () => null, assets: ['broken.jpg'] };
  const load = createRouteLoader(async () => module, () => { throw Error('image unavailable'); });
  assert.equal(await load(), module);
});
test('failed module load can be retried', async () => {
  let calls = 0;
  const module = { default: () => null };
  const load = createRouteLoader(async () => { if (++calls === 1) throw Error('offline'); return module; }, () => {});
  await assert.rejects(load());
  assert.equal(await load(), module);
});
test('fast destination waits only for actual door closure, then commits once', () => {
  const transition = new DoorTransition();
  let commits = 0;
  transition.prepared(() => commits++);
  assert.equal(commits, 0);
  transition.doorsClosed();
  transition.doorsClosed();
  assert.equal(commits, 1);
});
test('slow destination stays behind closed doors and commits as soon as ready', () => {
  const transition = new DoorTransition();
  let commits = 0;
  transition.doorsClosed();
  assert.equal(commits, 0);
  transition.prepared(() => commits++);
  assert.equal(commits, 1);
});
test('superseded Back/Forward transitions cannot commit stale destinations', () => {
  const transition = new DoorTransition();
  let commits = 0;
  transition.cancel();
  transition.doorsClosed();
  transition.prepared(() => commits++);
  assert.equal(commits, 0);
});

// Door completion is a physical two-door barrier, independent of callback order.
const { DoorMotion, DOOR_CLOSE_SECONDS, DOOR_OPEN_SECONDS } = await import('../src/navigation/doorMotion.ts');
test('normal door cycle takes 650ms with no timed hold', () => {
  assert.equal(DOOR_CLOSE_SECONDS + DOOR_OPEN_SECONDS, 0.65);
});
test('route swap waits for both doors and duplicate completions are ignored', () => {
  const doors = new DoorMotion();
  doors.update('left', -102); doors.update('right', 102);
  doors.setPhase('closing');
  doors.update('left', 0);
  assert.equal(doors.finish(), undefined);
  doors.update('right', 0);
  assert.equal(doors.finish(), 'closing');
  assert.equal(doors.finish(), undefined);
});
test('stale closing completion cannot unlock opening; both doors must open', () => {
  const doors = new DoorMotion();
  doors.setPhase('closing');
  assert.equal(doors.finish(), 'closing');
  doors.setPhase('opening');
  assert.equal(doors.finish(), undefined);
  doors.update('right', 102);
  assert.equal(doors.finish(), undefined);
  doors.update('left', -102);
  assert.equal(doors.finish(), 'opening');
  assert.equal(doors.finish(), undefined);
});
test('interrupted opening cannot complete a newly closing transition', () => {
  const doors = new DoorMotion();
  doors.setPhase('opening');
  doors.update('left', -70); doors.update('right', 70);
  doors.setPhase('closing');
  assert.equal(doors.finish(), undefined);
  doors.update('right', 0); doors.update('left', 0);
  assert.equal(doors.finish(), 'closing');
});

test('homepage starts open but its first navigation must still wait for closure', () => {
  const doors = new DoorMotion(true);
  doors.setPhase('closing');
  assert.equal(doors.finish(), undefined);
  doors.update('left', 0);
  assert.equal(doors.finish(), undefined);
  doors.update('right', 0);
  assert.equal(doors.finish(), 'closing');
});
