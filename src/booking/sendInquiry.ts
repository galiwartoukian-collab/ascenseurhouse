// Preserve the existing submission animation minimum while allowing unmount cleanup.
export async function sendInquiry(endpoint: string, body: FormData, signal: AbortSignal) {
  signal.throwIfAborted();
  let finishMinimum: () => void = () => {};
  const minimum = new Promise<void>(resolve => { finishMinimum = resolve; });
  const timer = setTimeout(finishMinimum, 900);
  const cancelMinimum = () => { clearTimeout(timer); finishMinimum(); };
  signal.addEventListener("abort", cancelMinimum, { once: true });
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body,
      headers: { Accept: "application/json" },
      signal,
    });
    await minimum;
    signal.throwIfAborted();
    if (!response.ok) throw new Error("Formspree submission failed");
  } finally {
    cancelMinimum();
    signal.removeEventListener("abort", cancelMinimum);
  }
}
