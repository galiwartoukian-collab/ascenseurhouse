// Share one module promise between React.lazy and prefetch/navigation. Media warmup
// intentionally has no completion signal: it must never delay the component.
export function createRouteLoader<T extends { default: unknown; assets?: string[] }>(
  load: () => Promise<T>,
  warmImage: (src: string) => void,
): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    pending ??= load().then(module => {
      for (const src of module.assets ?? []) {
        try { warmImage(src); } catch { /* Optional media cannot block the floor. */ }
      }
      return module;
    }).catch(error => { pending = undefined; throw error; });
    return pending;
  };
}

export class DoorTransition {
  private closed = false;
  private commit: (() => void) | undefined;
  private cancelled = false;

  doorsClosed() { this.closed = true; this.flush(); }
  prepared(commit: () => void) { this.commit = commit; this.flush(); }
  cancel() { this.cancelled = true; this.commit = undefined; }
  private flush() {
    if (!this.cancelled && this.closed && this.commit) {
      const commit = this.commit;
      this.commit = undefined;
      commit();
    }
  }
}
