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
function setup(route, total, mobile = true, height = 568, locked = false) {
  class Element {
    constructor(height, total, overflow) {
      Object.assign(this, { clientHeight: height, scrollHeight: total, scrollTop: 0, overflow, isConnected: true });
    }
    contains() { return true; }
    closest() { return null; }
  }
  const outer = new Element(height, total, mobile || route === 'about' ? 'auto' : 'hidden');
  const inner = new Element(mobile ? total : height, total, mobile ? 'visible' : 'auto');
  const listeners = {};
  const navigations = [];
  const exports = {};
  let now = 0;
  vm.runInNewContext(source, {
    exports, Element, Node: Element, performance: { now: () => now },
    getComputedStyle: el => ({ overflowY: el.overflow }),
    document: { querySelectorAll: () => route === 'about' ? [outer] : [outer, inner] },
    window: { matchMedia: () => ({ matches: mobile }), addEventListener: (name, fn) => { listeners[name] = fn; }, removeEventListener() {} },
    require: name => name === 'react' ? { useRef: value => ({ current: value }), useEffect: fn => fn() }
      : name === './gesture' ? gesture : { ...routes, prepareRoute: () => Promise.resolve() },
  });
  exports.useFloorScroll(route, locked, destination => { navigations.push(destination); return true; });
  now = 2000; // Beyond the hook's initial transition block.
  function event(name, y = 500, overrides = {}) {
    let prevented = false;
    listeners[name]({ target: inner, touches: name === 'touchend' || name === 'touchcancel' ? [] : [{ clientY: y, identifier: 1 }], changedTouches: [{ clientY: y, identifier: 1 }], cancelable: true, preventDefault() { prevented = true; }, ...overrides });
    return prevented;
  }
  return { outer, inner, event, navigations, setTime: value => { now = value; } };
}

// Browser-measured mobile clientHeight/scrollHeight pairs.
for (const [route, height, total] of [['ara', 844, 950], ['anais', 568, 949], ['bendi', 568, 635], ['bliss', 568, 743]]) {
  test(`${route}: duplicate inner marker cannot authorize a mobile exit`, () => {
    const { outer, event, navigations } = setup(route, total, true, height);
    const bottom = total - height;
    for (const start of [0, bottom / 2, bottom - 3.1]) {
      outer.scrollTop = start;
      event('touchstart');
      assert.equal(event('touchmove', 300), false);
      outer.scrollTop = bottom;
      assert.equal(event('touchmove', 100), false);
      event('touchend', 100);
      assert.deepEqual(navigations, []);
    }
    event('touchstart');
    assert.equal(event('touchmove', 300), false);
    assert.deepEqual(navigations, []);
    assert.equal(event('touchend', 300), false);
    assert.deepEqual(navigations, [routes.nextMainFloor(route)]);
  });
}
test('a profile without vertical overflow cannot falsely authorize navigation', () => {
  const { event, navigations } = setup('ara', 568);
  event('touchstart');
  assert.equal(event('touchmove', 300), false);
  event('touchend', 300);
  assert.deepEqual(navigations, []);
});
test('losing the original scroll owner consumes the gesture', () => {
  const { outer, inner, event, navigations } = setup('ara', 1200);
  outer.scrollTop = 632;
  event('touchstart');
  inner.clientHeight = 844;
  inner.overflow = 'auto';
  inner.scrollTop = 356;
  assert.equal(event('touchmove', 300), false);
  event('touchend', 300);
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
  assert.equal(event('touchmove', 700), false);
  assert.deepEqual(navigations, []);
  assert.equal(event('touchend', 700), false);
  assert.deepEqual(navigations, ['bendi']);
});

test('touchcancel never navigates after a hard boundary swipe', () => {
  const { outer, event, navigations } = setup('ara', 950);
  outer.scrollTop = 382;
  event('touchstart');
  assert.equal(event('touchmove', 200), false);
  event('touchcancel', 200);
  event('touchend', 200);
  assert.deepEqual(navigations, []);
});
test('threshold uses original-to-final distance, not accumulated movement', () => {
  const { outer, event, navigations } = setup('ara', 950);
  outer.scrollTop = 382;
  event('touchstart', 500);
  event('touchmove', 200);
  event('touchmove', 450);
  event('touchend', 450);
  assert.deepEqual(navigations, []);
});

test('multi-touch cancels a pending boundary gesture', () => {
  const { outer, event, navigations } = setup('ara', 950);
  outer.scrollTop = 382;
  event('touchstart');
  event('touchmove', 200, { touches: [{ clientY: 200, identifier: 1 }, { clientY: 210, identifier: 2 }] });
  event('touchend', 200);
  assert.deepEqual(navigations, []);
});
test('viewport resize cannot turn a middle-start gesture into a boundary gesture', () => {
  const { outer, event, navigations } = setup('anais', 949);
  outer.scrollTop = 200;
  event('touchstart');
  outer.clientHeight = 749;
  event('touchmove', 200);
  event('touchend', 200);
  assert.deepEqual(navigations, []);
});

test('About: native scrolling and momentum cannot navigate; a new bottom swipe exits on release', () => {
  const { outer, event, navigations } = setup('about', 1200);
  for (const start of [0, 300, 628.9]) {
    outer.scrollTop = start;
    event('touchstart');
    assert.equal(event('touchmove', 200), false);
    outer.scrollTop = 632;
    event('scroll', 200, { target: outer });
    assert.deepEqual(navigations, []);
    event('touchend', 100);
    event('scroll', 100, { target: outer });
    assert.deepEqual(navigations, []);
  }
  event('touchstart');
  assert.equal(event('touchmove', 410), false);
  assert.deepEqual(navigations, []);
  assert.equal(event('touchend', 410), false);
  assert.deepEqual(navigations, ['ara']);
});
for (const total of [500, 568, 570.9, 571, 571.1]) {
  test(`About: fitting-content tolerance with scrollHeight ${total}`, () => {
    const { event, navigations } = setup('about', total);
    event('touchstart');
    event('touchmove', 410);
    assert.deepEqual(navigations, []);
    event('touchend', 410);
    assert.deepEqual(navigations, total <= 571 ? ['ara'] : []);
  });
}
test('About: downward swipes, short swipes, and cancelled gestures do nothing', () => {
  const { event, navigations } = setup('about', 568);
  for (const y of [700, 411, 500]) {
    event('touchstart');
    assert.equal(event('touchmove', y), false);
    event('touchend', y);
  }
  event('touchstart');
  event('touchmove', 200);
  event('touchcancel', 200);
  event('touchend', 200);
  assert.deepEqual(navigations, []);
});
test('About: traveling or a gesture begun during arrival cooldown cannot navigate', () => {
  for (const locked of [true, false]) {
    const { event, navigations, setTime } = setup('about', 568, true, 568, locked);
    if (!locked) setTime(100);
    event('touchstart');
    setTime(3000);
    event('touchmove', 200);
    event('touchend', 200);
    assert.deepEqual(navigations, []);
  }
});
test('desktop About retains its existing touch navigation', () => {
  const { event, navigations } = setup('about', 568, false);
  event('touchstart');
  assert.equal(event('touchmove', 200), true);
  assert.deepEqual(navigations, ['ara']);
});
test('About: fitting content remains at bottom during browser rubber-banding', () => {
  const { outer, event, navigations } = setup('about', 568);
  outer.scrollTop = -10;
  event('touchstart');
  event('touchmove', 410);
  event('touchend', 410);
  assert.deepEqual(navigations, ['ara']);
});
