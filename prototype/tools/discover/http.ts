/**
 * The one polite HTTP client used by discovery and page fetching.
 *
 * - At most one request per `minIntervalMs` (default 1000 ms) per host, shared by all callers of
 *   the same client; requests to different hosts do not wait for each other.
 * - Exponential backoff on 429 and 5xx (honouring Retry-After), up to `maxRetries` retries.
 * - A descriptive User-Agent.
 * - An on-disk cache of successful responses under build/cache/http/ (build/ is git-ignored).
 * - A request refused by the environment's egress proxy is reported as
 *   "host blocked by environment egress policy: <host>" and never retried.
 *
 * Proxy: Node's global fetch ignores HTTPS_PROXY unless the process was started with
 * NODE_USE_ENV_PROXY=1 (Node ≥ 22.21). Command-line tools call ensureProxyEnv() first, which
 * re-runs the same command with that variable set when a proxy is configured.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeTextFile } from '../keying/csv.ts';

export const USER_AGENT =
  'Project1900-prototype-research/0.1 (non-commercial historical timetable transcription; ~1 request/s per host; contact: repository owner)';

export interface Clock {
  now(): number;
  sleep(ms: number): Promise<void>;
}

export const systemClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((res) => setTimeout(res, ms)),
};

export class BlockedHostError extends Error {
  override name = 'BlockedHostError';
  readonly host: string;
  constructor(host: string, detail: string) {
    super(`host blocked by environment egress policy: ${host} (${detail})`);
    this.host = host;
  }
}

export class HttpError extends Error {
  override name = 'HttpError';
  readonly status: number;
  readonly url: string;
  constructor(url: string, status: number, detail: string) {
    super(`HTTP ${status} for ${url}${detail ? `: ${detail}` : ''}`);
    this.status = status;
    this.url = url;
  }
}

/** Per-host pacing: each request to a host starts at least `intervalMs` after the previous one. */
export function createRateLimiter(intervalMs: number, clock: Clock) {
  const next = new Map<string, number>();
  return {
    async acquire(host: string): Promise<void> {
      const now = clock.now();
      const at = Math.max(now, next.get(host) ?? now);
      next.set(host, at + intervalMs);
      if (at > now) await clock.sleep(at - now);
    },
    /** Pushes the host's next slot to at least `untilMs` (used after Retry-After). */
    defer(host: string, untilMs: number): void {
      next.set(host, Math.max(next.get(host) ?? 0, untilMs));
    },
  };
}

export type CacheMode = 'use' | 'refresh' | 'off' | 'only';

export interface HttpOptions {
  userAgent?: string;
  minIntervalMs?: number;
  maxRetries?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  /** Folder for the response cache; null disables caching. */
  cacheDir?: string | null;
  cache?: CacheMode;
  clock?: Clock;
  fetchImpl?: typeof fetch;
  log?: (msg: string) => void;
}

export interface HttpResponse {
  url: string;
  status: number;
  contentType: string;
  body: Buffer;
  fromCache: boolean;
  text(): string;
  json<T = unknown>(): T;
}

export interface RequestOptions {
  accept?: string;
  cache?: CacheMode;
}

const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);

function hostOf(url: string): string {
  return new URL(url).host;
}

/** Walks an error's cause chain looking for the proxy's CONNECT refusal. */
export function proxyDenial(err: unknown): string | null {
  let e: unknown = err;
  for (let depth = 0; e && depth < 8; depth++) {
    const msg = String((e as { message?: unknown }).message ?? '');
    const m = /Proxy response \((\d{3})\) !== 200 when HTTP Tunneling/.exec(msg);
    if (m && (m[1] === '403' || m[1] === '407')) return `proxy answered ${m[1]} to CONNECT`;
    if (/\b(403|407)\b.*\bCONNECT\b|\bCONNECT\b.*\b(403|407)\b/i.test(msg)) return msg;
    e = (e as { cause?: unknown }).cause;
  }
  return null;
}

/** Recognises the egress gateway's own refusal page (transparent mode, no CONNECT). */
export function isPolicyDenialResponse(status: number, headers: Headers, body: string): string | null {
  if (status !== 403 && status !== 407) return null;
  const reason = headers.get('x-deny-reason');
  if (reason) return `x-deny-reason: ${reason}`;
  if (/^Host not in allowlist/i.test(body.trim())) return body.trim().slice(0, 120);
  if (status === 407) return 'proxy authentication required';
  return null;
}

function retryAfterMs(h: string | null, clock: Clock): number | null {
  if (!h) return null;
  if (/^\d+$/.test(h.trim())) return Number(h.trim()) * 1000;
  const t = Date.parse(h);
  return Number.isNaN(t) ? null : Math.max(0, t - clock.now());
}

function cacheKey(url: string, accept: string): string {
  return createHash('sha256').update(`GET ${url}\n${accept}`).digest('hex');
}

function makeResponse(url: string, status: number, contentType: string, body: Buffer, fromCache: boolean): HttpResponse {
  return {
    url, status, contentType, body, fromCache,
    text: () => body.toString('utf8'),
    json: <T,>() => JSON.parse(body.toString('utf8')) as T,
  };
}

export function createHttp(o: HttpOptions = {}) {
  const clock = o.clock ?? systemClock;
  const fetchImpl = o.fetchImpl ?? globalThis.fetch;
  const limiter = createRateLimiter(o.minIntervalMs ?? 1000, clock);
  const maxRetries = o.maxRetries ?? 5;
  const base = o.baseBackoffMs ?? 2000;
  const maxBackoff = o.maxBackoffMs ?? 60_000;
  const ua = o.userAgent ?? USER_AGENT;
  const log = o.log ?? (() => {});
  const blocked = new Map<string, BlockedHostError>();

  const cachePaths = (url: string, accept: string) => {
    if (!o.cacheDir) return null;
    const k = cacheKey(url, accept);
    const dir = join(o.cacheDir, hostOf(url).replace(/[^A-Za-z0-9.-]/g, '_'), k.slice(0, 2));
    return { body: join(dir, `${k}.body`), meta: join(dir, `${k}.json`) };
  };

  async function get(url: string, ro: RequestOptions = {}): Promise<HttpResponse> {
    const accept = ro.accept ?? '*/*';
    const mode = ro.cache ?? o.cache ?? 'use';
    const host = hostOf(url);
    const cp = mode === 'off' ? null : cachePaths(url, accept);
    if (cp && (mode === 'use' || mode === 'only') && existsSync(cp.meta) && existsSync(cp.body)) {
      const meta = JSON.parse(readFileSync(cp.meta, 'utf8')) as { status: number; contentType: string };
      return makeResponse(url, meta.status, meta.contentType, readFileSync(cp.body), true);
    }
    if (mode === 'only') throw new Error(`not in the HTTP cache (cache mode "only"): ${url}`);
    const known = blocked.get(host);
    if (known) throw known;

    for (let attempt = 0; ; attempt++) {
      await limiter.acquire(host);
      let res: Response;
      try {
        res = await fetchImpl(url, { headers: { 'user-agent': ua, accept }, redirect: 'follow' });
      } catch (e) {
        const denial = proxyDenial(e);
        if (denial) { const be = new BlockedHostError(host, denial); blocked.set(host, be); throw be; }
        if (attempt >= maxRetries) throw new Error(`request failed after ${attempt + 1} attempt(s): ${url}: ${(e as Error).message}${(e as { cause?: Error }).cause ? ` (${(e as { cause?: Error }).cause!.message})` : ''}`);
        const wait = Math.min(maxBackoff, base * 2 ** attempt);
        log(`network error on ${url}; retrying in ${wait} ms`);
        await clock.sleep(wait);
        continue;
      }
      const body = Buffer.from(await res.arrayBuffer());
      const denial = isPolicyDenialResponse(res.status, res.headers, res.status === 403 || res.status === 407 ? body.toString('utf8') : '');
      if (denial) { const be = new BlockedHostError(host, denial); blocked.set(host, be); throw be; }
      if (RETRY_STATUS.has(res.status)) {
        if (attempt >= maxRetries) throw new HttpError(url, res.status, `gave up after ${attempt + 1} attempt(s)`);
        const ra = retryAfterMs(res.headers.get('retry-after'), clock);
        const wait = Math.min(maxBackoff, Math.max(ra ?? 0, base * 2 ** attempt));
        log(`HTTP ${res.status} from ${host}; backing off ${wait} ms`);
        limiter.defer(host, clock.now() + wait);
        continue;
      }
      if (!res.ok) throw new HttpError(url, res.status, body.toString('utf8').slice(0, 200).replace(/\s+/g, ' '));
      const contentType = res.headers.get('content-type') ?? '';
      if (cp) {
        writeTextFile(cp.body, body);
        writeTextFile(cp.meta, JSON.stringify({ url, status: res.status, contentType, accept }, null, 1) + '\n');
      }
      return makeResponse(url, res.status, contentType, body, false);
    }
  }

  return { get, blockedHosts: () => [...blocked.keys()].sort() };
}

export type Http = ReturnType<typeof createHttp>;

/**
 * Makes sure Node's fetch uses the configured HTTPS proxy: when HTTPS_PROXY is set and the process
 * was not started with NODE_USE_ENV_PROXY=1, re-runs the same command with it set and exits with
 * the child's status. Call it at the top of a command-line entry point, before any request.
 */
export function ensureProxyEnv(): void {
  const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy;
  if (!proxy || process.env.NODE_USE_ENV_PROXY === '1') return;
  if (process.env.P1900_PROXY_REEXEC === '1') {
    console.error('NODE_USE_ENV_PROXY=1 did not take effect; run with Node ≥ 22.21: NODE_USE_ENV_PROXY=1 node <tool>');
    process.exit(2);
  }
  // --disable-warning silences Node's one-line notice that the env-proxy agent is experimental.
  const r = spawnSync(process.execPath, ['--disable-warning=UNDICI-EHPA', ...process.execArgv, ...process.argv.slice(1)], {
    stdio: 'inherit',
    env: { ...process.env, NODE_USE_ENV_PROXY: '1', P1900_PROXY_REEXEC: '1' },
  });
  process.exit(r.status ?? 1);
}
