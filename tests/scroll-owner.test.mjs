import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as gesture from '../src/navigation/gesture.ts';
import * as routes from '../src/navigation/routeConfig.ts';

// Exercise the hook's event listeners, including duplicate markers and cancellation.
const source = ts.transpileModule(fs.readFileSync(new URL('../src/navigation/useFloorScroll.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function setup(route, total, mobile = true, height = 568) {
  class Element {
    constructor(height, total, overflow) {
      Object.assign(this, { clientHeight: height, scrollHeight: total, scrollTop: 0, overflow, isConnected: true });
    }
    contains() { return true; }
    closest() { return null; }
  }
  const outer = new Element(height, total, mobile ? 'auto' : 'hidden');
  const inner = new Element(mobile ? total : height, total, mobile ? 'visible' : 'auto');
  const listeners = {};
  const navigations = [];
  const exports = {};
  let now = 0;
  vm.runInNewContext(source, {
    exports, Element, Node: Element, performance: { now: () => now },
    getComputedStyle: el => ({ overflowY: el.overflow }),
    document: { querySelectorAll: () => [outer, inner] },
    window: { matchMedia: () => ({ matches: mobile }), addEventListener: (name, fn) => { listeners[name] = fn; }, removeEventListener() {} },
    require: name => name === 'react' ? { useRef: value => ({ current: value }), useEffect: fn => fn() }
      : name === './gesture' ? gesture : { ...routes, prepareRoute: () => Promise.resolve() },
  });
  exports.useFloorScroll(route, false, destination => { navigations.push(destination); return true; });
  now = 2000; // Beyond the hook's initial transition block.
  function event(name, y = 500) {
    let prevented = false;
    listeners[name]({ target: inner, touches: name === 'touchend' ? [] : [{ clientY: y }], cancelable: true, preventDefault() { prevented = true; } });
    return prevented;
  }
  return { outer, inner, event, navigations };
}

// Browser-measured mobile clientHeight/scrollHeight pairs.
for (const [route, height, total] of [['ara', 844, 950], ['anais', 568, 949], ['bendi', 568, 635], ['bliss', 568, 743]]) {
  test(`${route}: duplicate inner marker cannot authorize a mobile exit`, () => {
    const { outer, event, navigations } = setup(route, total, true, height);
    const bottom = total - height;
    for (const start of [0, bottom / 2, bottom - 0.5]) {
      outer.scrollTop = start;
      event('touchstart');
      assert.equal(event('touchmove', 300), false);
      outer.scrollTop = bottom;
      assert.equal(event('touchmove', 100), false);
      event('touchend');
      assert.deepEqual(navigations, []);
    }
    event('touchstart');
    assert.equal(event('touchmove', 300), true);
    assert.deepEqual(navigations, [routes.nextMainFloor(route)]);
  });
}
test('a profile without vertical overflow cannot falsely authorize navigation', () => {
  const { event, navigations } = setup('ara', 568);
  event('touchstart');
  assert.equal(event('touchmove', 300), false);
  assert.deepEqual(navigations, []);
});
test('losing the original scroll owner consumes the gesture', () => {
  const { outer, inner, event, navigations } = setup('ara', 1200);
  outer.scrollTop = 356;
  event('touchstart');
  inner.clientHeight = 844;
  inner.overflow = 'auto';
  inner.scrollTop = 356;
  assert.equal(event('touchmove', 300), false);
  assert.deepEqual(navigations, []);
});

test('desktop retains the inner scroll owner', () => {
  const { outer, inner, event, navigations } = setup('ara', 1200, false);
  outer.scrollTop = 0;
  inner.scrollTop = 632;
  event('touchstart');
  assert.equal(event('touchmove', 300), true);
  assert.deepEqual(navigations, ['bendi']);
});
test('reaching the top requires release before a previous-floor swipe', () => {
  const { outer, event, navigations } = setup('anais', 949);
  outer.scrollTop = 100;
  event('touchstart');
  outer.scrollTop = 0;
  assert.equal(event('touchmove', 700), false);
  event('touchend');
  assert.deepEqual(navigations, []);
  event('touchstart');
  assert.equal(event('touchmove', 700), true);
  assert.deepEqual(navigations, ['bendi']);
});
