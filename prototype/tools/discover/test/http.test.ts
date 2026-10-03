import { describe, expect, it } from 'vitest';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BlockedHostError, createHttp, createRateLimiter, HttpError, isPolicyDenialResponse, proxyDenial, type Clock } from '../http.ts';

/** A fake clock: sleep advances time instantly and records the wait. */
function fakeClock(start = 1_000_000): Clock & { t: number; sleeps: number[] } {
  const c = {
    t: start,
    sleeps: [] as number[],
    now: () => c.t,
    sleep: async (ms: number) => { c.sleeps.push(ms); c.t += ms; },
  };
  return c;
}

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;

function fakeFetch(h: Handler) {
  const calls: Array<{ url: string; at: number; headers: Record<string, string> }> = [];
  const clockRef: { clock?: Clock } = {};
  const f = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, at: clockRef.clock?.now() ?? 0, headers: (init?.headers ?? {}) as Record<string, string> });
    return h(url, init);
  }) as typeof fetch;
  return { f, calls, clockRef };
}

describe('rate limiter', () => {
  it('spaces requests to one host by the interval and leaves other hosts alone', async () => {
    const clock = fakeClock();
    const lim = createRateLimiter(1000, clock);
    const t0 = clock.t;
    await lim.acquire('archive.org');
    await lim.acquire('archive.org');
    await lim.acquire('gallica.bnf.fr');
    await lim.acquire('archive.org');
    expect(clock.sleeps).toEqual([1000, 1000]);
    expect(clock.t - t0).toBe(2000);
  });

  it('reserves slots synchronously, so concurrent callers queue', async () => {
    // A frozen clock: all three callers ask at the same instant.
    const sleeps: number[] = [];
    const clock: Clock & { sleeps: number[] } = { now: () => 5000, sleep: async (ms) => { sleeps.push(ms); }, sleeps };
    const lim = createRateLimiter(1000, clock);
    await Promise.all([lim.acquire('h'), lim.acquire('h'), lim.acquire('h')]);
    expect([...clock.sleeps].sort()).toEqual([1000, 2000]);
  });

  it('does not wait when the interval has already passed', async () => {
    const clock = fakeClock();
    const lim = createRateLimiter(1000, clock);
    await lim.acquire('h');
    clock.t += 5000;
    await lim.acquire('h');
    expect(clock.sleeps).toEqual([]);
  });
});

describe('polite http client', () => {
  it('sends a descriptive user agent and paces one host at ~1 request/second', async () => {
    const clock = fakeClock();
    const ff = fakeFetch(() => new Response('{"ok":1}', { status: 200, headers: { 'content-type': 'application/json' } }));
    ff.clockRef.clock = clock;
    const http = createHttp({ clock, fetchImpl: ff.f, cacheDir: null });
    await http.get('https://archive.org/metadata/a');
    await http.get('https://archive.org/metadata/b');
    await http.get('https://archive.org/metadata/c');
    expect(ff.calls.map((c) => c.at - ff.calls[0]!.at)).toEqual([0, 1000, 2000]);
    expect(ff.calls[0]!.headers['user-agent']).toMatch(/Project1900/);
  });

  it('backs off exponentially on 503 and honours Retry-After on 429', async () => {
    const clock = fakeClock();
    const statuses = [503, 503, 429, 200];
    const ff = fakeFetch(() => {
      const s = statuses.shift()!;
      return new Response(s === 200 ? 'done' : 'busy', { status: s, headers: s === 429 ? { 'retry-after': '30' } : {} });
    });
    ff.clockRef.clock = clock;
    const http = createHttp({ clock, fetchImpl: ff.f, cacheDir: null, baseBackoffMs: 2000 });
    const res = await http.get('https://gallica.bnf.fr/SRU?x=1');
    expect(res.text()).toBe('done');
    const gaps = ff.calls.slice(1).map((c, i) => c.at - ff.calls[i]!.at);
    expect(gaps).toEqual([2000, 4000, 30000]);
  });

  it('gives up after maxRetries with an HttpError', async () => {
    const clock = fakeClock();
    const ff = fakeFetch(() => new Response('x', { status: 502 }));
    const http = createHttp({ clock, fetchImpl: ff.f, cacheDir: null, maxRetries: 2, baseBackoffMs: 10 });
    await expect(http.get('https://archive.org/x')).rejects.toBeInstanceOf(HttpError);
    expect(ff.calls).toHaveLength(3);
  });

  it('does not retry a 404', async () => {
    const ff = fakeFetch(() => new Response('nope', { status: 404 }));
    const http = createHttp({ clock: fakeClock(), fetchImpl: ff.f, cacheDir: null });
    await expect(http.get('https://archive.org/x')).rejects.toThrow(/HTTP 404/);
    expect(ff.calls).toHaveLength(1);
  });

  it('reports a CONNECT refusal by the egress proxy as a blocked host, once, without retrying', async () => {
    // The shape Node's fetch (undici EnvHttpProxyAgent) produces when the proxy answers 403 to CONNECT.
    const ff = fakeFetch(() => {
      const inner = Object.assign(new Error('Proxy response (403) !== 200 when HTTP Tunneling'), { code: 'UND_ERR_ABORTED' });
      const mid = new Error('Request was cancelled.', { cause: inner });
      throw new TypeError('fetch failed', { cause: mid });
    });
    const http = createHttp({ clock: fakeClock(), fetchImpl: ff.f, cacheDir: null });
    const err = await http.get('https://babel.hathitrust.org/cgi/imgsrv/image?id=x&seq=1&size=full').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(BlockedHostError);
    expect((err as Error).message).toMatch(/^host blocked by environment egress policy: babel\.hathitrust\.org/);
    await expect(http.get('https://babel.hathitrust.org/other')).rejects.toBeInstanceOf(BlockedHostError);
    expect(ff.calls).toHaveLength(1);
    expect(http.blockedHosts()).toEqual(['babel.hathitrust.org']);
  });

  it("recognises the gateway's 403 page in transparent mode", async () => {
    const ff = fakeFetch(() => new Response('Host not in allowlist: archive.org. Add this host to your network egress settings to allow access.', {
      status: 403, headers: { 'x-deny-reason': 'host_not_allowed', 'content-type': 'text/plain' },
    }));
    const http = createHttp({ clock: fakeClock(), fetchImpl: ff.f, cacheDir: null });
    await expect(http.get('https://archive.org/metadata/x')).rejects.toThrow('host blocked by environment egress policy: archive.org');
  });

  it('treats an ordinary 403 from the site as an HTTP error, not a policy block', () => {
    expect(isPolicyDenialResponse(403, new Headers(), '<html>Forbidden</html>')).toBeNull();
    expect(isPolicyDenialResponse(403, new Headers({ 'x-deny-reason': 'host_not_allowed' }), '')).toMatch(/host_not_allowed/);
    expect(proxyDenial(new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND') }))).toBeNull();
  });

  it('caches successful responses on disk and can answer from the cache only', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'p1900-http-'));
    let n = 0;
    const ff = fakeFetch(() => new Response(`body ${++n}`, { status: 200, headers: { 'content-type': 'text/plain' } }));
    const http = createHttp({ clock: fakeClock(), fetchImpl: ff.f, cacheDir: dir });
    const a = await http.get('https://archive.org/download/x/x_djvu.txt');
    const b = await http.get('https://archive.org/download/x/x_djvu.txt');
    expect(a.text()).toBe('body 1');
    expect(b.text()).toBe('body 1');
    expect(b.fromCache).toBe(true);
    expect(ff.calls).toHaveLength(1);
    expect(readdirSync(dir)).toEqual(['archive.org']);
    const offline = createHttp({ clock: fakeClock(), fetchImpl: ff.f, cacheDir: dir, cache: 'only' });
    expect((await offline.get('https://archive.org/download/x/x_djvu.txt')).text()).toBe('body 1');
    await expect(offline.get('https://archive.org/other')).rejects.toThrow(/not in the HTTP cache/);
    const refresh = await http.get('https://archive.org/download/x/x_djvu.txt', { cache: 'refresh' });
    expect(refresh.text()).toBe('body 2');
  });
});
