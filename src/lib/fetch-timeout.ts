/**
 * `fetch` with a hard timeout so a hung connection can't stall the hourly run.
 *
 * A plain `.catch(() => [])` only handles a rejected request — it does nothing
 * for a socket that connects and then hangs, which would block the gather /
 * generate / syndicate stages until the platform kills the whole run. Every
 * server-side outbound request in the pipeline should use this.
 *
 * Node 18.17+/20+/22 provide `AbortSignal.timeout`. A caller-supplied
 * `init.signal` takes precedence if present.
 */
export function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  return fetch(input, { ...init, signal: init.signal ?? AbortSignal.timeout(timeoutMs) });
}
