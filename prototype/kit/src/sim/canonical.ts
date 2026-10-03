/**
 * Canonical JSON: object keys sorted by UTF-16 code unit, no undefined values, finite numbers
 * only, -0 written as 0. Two equal states always serialise to the same string.
 */
export function canonicalJson(value: unknown): string {
  return write(value, '$');
}

function write(v: unknown, path: string): string {
  if (v === null) return 'null';
  switch (typeof v) {
    case 'boolean': return v ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(v)) throw new Error(`Non-finite number at ${path}`);
      return Object.is(v, -0) ? '0' : JSON.stringify(v);
    case 'string': return JSON.stringify(v);
    case 'object': {
      if (Array.isArray(v)) return '[' + v.map((x, i) => write(x, `${path}[${i}]`)).join(',') + ']';
      if (v instanceof Map || v instanceof Set) throw new Error(`Map/Set at ${path}: convert to sorted arrays first`);
      const obj = v as Record<string, unknown>;
      const keys = Object.keys(obj).sort();
      const parts: string[] = [];
      for (const k of keys) {
        const x = obj[k];
        if (x === undefined) throw new Error(`undefined at ${path}.${k}`);
        parts.push(JSON.stringify(k) + ':' + write(x, `${path}.${k}`));
      }
      return '{' + parts.join(',') + '}';
    }
    default:
      throw new Error(`Cannot serialise ${typeof v} at ${path}`);
  }
}

/** Deep copy through canonical JSON (also proves the value is serialisable). */
export function cloneCanonical<T>(value: T): T {
  return JSON.parse(canonicalJson(value)) as T;
}
