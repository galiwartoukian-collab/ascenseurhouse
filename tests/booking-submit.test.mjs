import test from 'node:test';
import assert from 'node:assert/strict';
import { sendInquiry } from '../src/booking/sendInquiry.ts';

const endpoint = 'https://example.invalid/inquiry';
test('successful submission keeps the existing 900ms minimum', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const controller = new AbortController();
  const body = new FormData();
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, endpoint);
    assert.equal(options.signal, controller.signal);
    assert.equal(options.body, body);
    return { ok: true };
  });
  let finished = false;
  const pending = sendInquiry(endpoint, body, controller.signal).then(() => { finished = true; });
  await Promise.resolve();
  t.mock.timers.tick(899);
  await Promise.resolve();
  assert.equal(finished, false);
  t.mock.timers.tick(1);
  await pending;
  assert.equal(fetchMock.mock.callCount(), 1);
});
test('leaving after the response cancels the remaining minimum timer', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true }));
  const controller = new AbortController();
  const pending = sendInquiry(endpoint, new FormData(), controller.signal);
  await Promise.resolve();
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});
test('leaving during a request aborts fetch and settles without waiting', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  const controller = new AbortController();
  const pending = sendInquiry(endpoint, new FormData(), controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});
test('HTTP failures preserve the existing error flow', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false }));
  const pending = sendInquiry(endpoint, new FormData(), new AbortController().signal);
  t.mock.timers.tick(900);
  await assert.rejects(pending, /Formspree submission failed/);
});
test('network failures clear the timer and reject immediately', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  await assert.rejects(sendInquiry(endpoint, new FormData(), new AbortController().signal), /offline/);
});
