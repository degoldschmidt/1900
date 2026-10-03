/**
 * The map itself: one SVG of the invented world, fitted to the screen, with drag to pan, pinch or
 * wheel to zoom, and buttons to zoom and refit. Lines, dots and labels keep their size on screen
 * whatever the zoom (sizes are multiplied by `k`, map units per screen pixel). Every colour comes
 * from a CSS token. Cities are buttons.
 */
import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { MapViewModel } from '../views/index.ts';

export type Highlight = 'me' | 'goal' | 'here' | null;

interface Box { x: number; y: number; w: number; h: number }

const ANCHOR: Record<string, [number, number, 'start' | 'middle' | 'end']> = {
  n: [0, -1.5, 'middle'], ne: [0.8, -0.9, 'start'], e: [1.1, 0.35, 'start'], se: [0.8, 1.3, 'start'],
  s: [0, 1.9, 'middle'], sw: [-0.8, 1.3, 'end'], w: [-1.1, 0.35, 'end'], nw: [-0.8, -0.9, 'end'],
};

function fit(box: [number, number, number, number], w: number, h: number): Box {
  const [x0, y0, x1, y1] = box;
  const bw = x1 - x0; const bh = y1 - y0;
  const scale = Math.max(bw / w, bh / h);
  const vw = w * scale; const vh = h * scale;
  return { x: x0 - (vw - bw) / 2, y: y0 - (vh - bh) / 2, w: vw, h: vh };
}

export function MapCanvas({ mv, token, onCity, highlight, interactive = true, extra, over, label, showToken = true, fitBox, sheetOpen = false, center = null, insetBottom = 0 }: {
  mv: MapViewModel; token: { x: number; y: number }; onCity?: ((id: string) => void) | undefined; highlight?: Highlight; interactive?: boolean;
  extra?: (k: number) => ComponentChildren;
  /** Drawn above the towns (markers that must not hide under a dot). */
  over?: (k: number) => ComponentChildren;
  label: string; showToken?: boolean; fitBox?: [number, number, number, number];
  /** A sheet covers part of the map (the bottom on a phone, the right on a wide screen). */
  sheetOpen?: boolean;
  /** A point to bring into the visible part of the map (the city whose sheet is open). */
  center?: { x: number; y: number } | null;
  /** Height of the bar or card over the bottom of the map when no sheet is open (px). */
  insetBottom?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 390, h: 600 });
  /** The user's own pan and zoom (null: fitted), and the centring it has overridden. */
  const [vb, setVbState] = useState<Box | null>(null);
  const [ovr, setOvr] = useState('');
  const drag = useRef<{ pts: Map<number, { x: number; y: number }>; moved: number; start: Box | null; d0: number; c0: { x: number; y: number } | null }>({ pts: new Map(), moved: 0, start: null, d0: 0, c0: null });

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height }); };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const g = mv.geo;
  const [bx0, by0, bx1, by1] = fitBox ?? g.bounds;
  const pad = Math.max(bx1 - bx0, by1 - by0) * 0.08;
  // The part of the map left visible by the bars and sheets drawn over it.
  // The map is fitted to the part left visible by the bars drawn over it (on a wide screen, also
  // beside the sheet); on a phone a sheet then covers the lower part, and the open city is moved
  // into the part above it at the same zoom.
  const wide = size.w >= 896;
  const fitB = !interactive ? 0 : Math.min(insetBottom, size.h * 0.3);
  const fitR = !interactive ? 0 : wide ? (sheetOpen ? 430 : 0) : 52;
  const fw = Math.max(120, size.w - fitR); const fh = Math.max(120, size.h - fitB);
  const top = fit([bx0 - pad, by0 - pad, bx1 + pad * 1.6, by1 + pad], fw, fh);
  const fitted: Box = { x: top.x, y: top.y, w: top.w * (size.w / fw), h: top.h * (size.h / fh) };
  const visW = wide ? fw : size.w; const visH = wide ? fh : sheetOpen ? size.h * 0.36 : fh;
  // A point to show (the open sheet's city) is centred in the visible part at the current zoom,
  // until the user pans or zooms away from it.
  const centerKey = center ? `${Math.round(center.x)},${Math.round(center.y)}` : '';
  const base = vb ?? fitted;
  const view: Box = center && ovr !== centerKey
    ? { ...base, x: center.x - (visW / 2) * (base.w / size.w), y: center.y - (visH / 2) * (base.w / size.w) }
    : base;
  const setVb = (b: Box | null) => { setVbState(b); setOvr(centerKey); };
  const k = view.w / size.w;
  const maxW = fitted.w * 1.5; const minW = Math.min(fitted.w, 120 * (size.w / Math.max(size.h, 1)) + 120);

  const zoom = (factor: number, cx = view.x + view.w / 2, cy = view.y + view.h / 2) => {
    const w = Math.max(minW, Math.min(maxW, view.w * factor));
    const f = w / view.w;
    setVb({ x: cx - (cx - view.x) * f, y: cy - (cy - view.y) * f, w, h: view.h * f });
  };
  const toMap = (px: number, py: number) => {
    const r = wrap.current!.getBoundingClientRect();
    return { x: view.x + ((px - r.left) / r.width) * view.w, y: view.y + ((py - r.top) / r.height) * view.h };
  };

  useEffect(() => { setVbState(null); }, [fitBox?.join(',')]);
  const onDown = (e: PointerEvent) => {
    if (!interactive) return;
    const st = drag.current;
    st.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    st.moved = 0; st.start = { ...view };
    if (st.pts.size === 2) {
      const [a, b] = [...st.pts.values()];
      st.d0 = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      st.c0 = toMap((a!.x + b!.x) / 2, (a!.y + b!.y) / 2);
    }
  };
  const onMove = (e: PointerEvent) => {
    const st = drag.current;
    const prev = st.pts.get(e.pointerId);
    if (!prev || !st.start) return;
    st.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (st.pts.size === 1) {
      const dx = e.clientX - prev.x; const dy = e.clientY - prev.y;
      st.moved += Math.abs(dx) + Math.abs(dy);
      if (st.moved > 6) {
        try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* not capturable */ }
        setVb({ ...view, x: view.x - dx * k, y: view.y - dy * k });
      }
    } else if (st.pts.size === 2 && st.c0 && st.d0 > 0) {
      const [a, b] = [...st.pts.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      st.moved += 10;
      const w = Math.max(minW, Math.min(maxW, st.start.w * (st.d0 / Math.max(d, 1))));
      const f = w / st.start.w;
      setVb({ x: st.c0.x - (st.c0.x - st.start.x) * f, y: st.c0.y - (st.c0.y - st.start.y) * f, w, h: st.start.h * f });
    }
  };
  const onUp = (e: PointerEvent) => { drag.current.pts.delete(e.pointerId); if (drag.current.pts.size === 0) drag.current.start = null; };
  const onWheel = (e: WheelEvent) => {
    if (!interactive) return;
    e.preventDefault();
    const c = toMap(e.clientX, e.clientY);
    zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, c.x, c.y);
  };
  const tap = (id: string) => { if (drag.current.moved > 6) return; onCity?.(id); };

  const here = mv.cities.find((c) => c.here);
  const hl = highlight === 'me' ? { x: token.x, y: token.y } : highlight === 'goal' && mv.goal ? { x: mv.goal.x, y: mv.goal.y } : highlight === 'here' && here ? { x: here.x, y: here.y } : null;
  const grid: number[] = []; for (let i = -200; i <= 1600; i += 100) grid.push(i);

  return (
    <div class={`map-wrap${mv.night ? ' is-night' : ''}`} ref={wrap}>
      <svg class="map" viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} role="group" aria-label={label}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}>
        <defs>
          <clipPath id="land-clip"><path d={g.land} /></clipPath>
        </defs>
        <rect class="sea" x={-2000} y={-2000} width={5000} height={5000} />
        <g class="grid">{grid.map((v) => <path key={`v${v}`} d={`M${v} -2000V3000`} stroke-width={0.6 * k} />)}{grid.map((v) => <path key={`h${v}`} d={`M-2000 ${v}H3000`} stroke-width={0.6 * k} />)}</g>
        <path class="coast-halo" d={g.land} stroke-width={7 * k} />
        <path class="land" d={g.land} />
        <g clip-path="url(#land-clip)">
          {g.countries.map((c, i) => <path key={c.id} class={`country country-${i}`} d={c.d} />)}
        </g>
        {g.water.map((w) => <path key={w.id} class="lake" d={w.d} />)}
        <path class="coast" d={g.land} stroke-width={1 * k} />
        {g.water.map((w) => <path key={`${w.id}-c`} class="coast" d={w.d} stroke-width={1 * k} />)}
        {g.labels.map((l) => (
          <text key={l.text} class={`water-label water-${l.kind}`} x={l.at[0]} y={l.at[1]} transform={`rotate(${l.rotate} ${l.at[0]} ${l.at[1]})`} font-size={l.kind === 'sea' ? 20 : 12} letter-spacing={l.kind === 'sea' ? 6 : 2} text-anchor="middle">{l.text}</text>
        ))}
        {g.countries.map((c) => <text key={`${c.id}-l`} class="country-label" x={c.label[0]} y={c.label[1]} font-size={20} letter-spacing={9} text-anchor="middle">{c.name.toUpperCase()}</text>)}
        <g class="borders" clip-path="url(#land-clip)">{g.borders.map((d, i) => <path key={i} d={d} stroke-width={1.5 * k} stroke-dasharray={`${7 * k} ${3 * k} ${1.5 * k} ${3 * k}`} />)}</g>
        <g class="lines">
          {g.segments.filter((s) => s.mode === 'steamer').map((s) => <path key={s.key} class="steamer" d={s.d} stroke-width={1.5 * k} stroke-dasharray={`${1.5 * k} ${4 * k}`} />)}
          {g.segments.filter((s) => s.mode === 'rail').map((s) => <path key={s.key} class="rail" d={s.d} stroke-width={3.6 * k} />)}
          {g.segments.filter((s) => s.mode === 'rail').map((s) => <path key={`${s.key}-g`} class="rail-gap" d={s.d} stroke-width={1.5 * k} stroke-dasharray={`${5 * k} ${5 * k}`} />)}
        </g>
        {mv.route ? <path class="route" d={mv.route} stroke-width={4.5 * k} /> : null}
        {mv.night ? <rect class="night" x={view.x - 10} y={view.y - 10} width={view.w + 20} height={view.h + 20} /> : null}
        {extra ? extra(k) : null}
        <g class="attention">
          {mv.cities.filter((c) => c.attention > 0).map((c) => (
            <circle key={c.id} class={`att att-${c.attention}`} cx={c.x} cy={c.y} r={(16 + 6 * c.attention) * k} stroke-width={1.2 * k} stroke-dasharray={`${2 * k} ${3 * k}`} />
          ))}
        </g>
        {mv.cities.map((c) => {
          const [ax, ay, anchor] = ANCHOR[c.label] ?? ANCHOR.e!;
          const size = c.kind === 'town' ? 13.5 : 11.5;
          const r = c.kind === 'town' ? 5 : 3.4;
          const cls = `city city-${c.kind}${c.here ? ' is-here' : ''}${c.goal ? ' is-goal' : ''}${c.direct ? ' is-direct' : ''}`;
          return (
            <g key={c.id} id={`city-${c.id}`} class={cls} role={onCity ? 'button' : undefined} tabIndex={onCity ? 0 : undefined}
              aria-label={`${c.name}${c.here ? ', you are here' : ''}${c.goal ? ', your goal' : ''}${c.direct ? ', one train away' : ''}`}
              onClick={onCity ? () => tap(c.id) : undefined}
              onKeyDown={onCity ? (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCity(c.id); } } : undefined}>
              <circle class="city-hit" cx={c.x} cy={c.y} r={17 * k} />
              <circle class="city-focus" cx={c.x} cy={c.y} r={11 * k} stroke-width={2.5 * k} />
              {c.direct ? <circle class="city-ring" cx={c.x} cy={c.y} r={(r + 3.5) * k} stroke-width={1.4 * k} /> : null}
              <circle class="city-dot" cx={c.x} cy={c.y} r={r * k} stroke-width={1.6 * k} />
              <text class="city-label" x={c.x + ax * size * k} y={c.y + ay * size * k} font-size={size * k} text-anchor={anchor} stroke-width={3.2 * k}>{c.name}</text>
            </g>
          );
        })}
        {mv.goal ? (
          <g class="goal-pin" aria-hidden="true">
            <path d={`M${mv.goal.x} ${mv.goal.y - 5 * k}V${mv.goal.y - 30 * k}`} stroke-width={1.6 * k} />
            <path class="goal-flag" d={`M${mv.goal.x} ${mv.goal.y - 30 * k}h${15 * k}l${-4 * k} ${5 * k}l${4 * k} ${5 * k}h${-15 * k}Z`} />
            {mv.goal.label ? (
              <g>
                <rect class="goal-tag" x={mv.goal.x + 17 * k} y={mv.goal.y - 32 * k} width={(mv.goal.label.length * 6.6 + 10) * k} height={14 * k} rx={1.5 * k} stroke-width={1 * k} />
                <text class="goal-text" x={mv.goal.x + 22 * k} y={mv.goal.y - 21.5 * k} font-size={10.5 * k}>{mv.goal.label}</text>
              </g>
            ) : null}
          </g>
        ) : null}
        {over ? over(k) : null}
        {showToken ? (
          <g class="token" aria-hidden="true" key={`${Math.round(token.x)},${Math.round(token.y)}`}>
            <circle class="token-halo" cx={token.x} cy={token.y} r={11 * k} />
            <circle class="token-dot" cx={token.x} cy={token.y} r={6.5 * k} stroke-width={2.4 * k} />
          </g>
        ) : null}
        {hl ? <circle class="coach-ring" cx={hl.x} cy={hl.y} r={24 * k} stroke-width={2.5 * k} /> : null}
      </svg>
      {interactive ? (
        <div class="map-tools">
          <button type="button" class="tool" id="zoom-in" aria-label="Zoom in" onClick={() => zoom(1 / 1.4)}>+</button>
          <button type="button" class="tool" id="zoom-out" aria-label="Zoom out" onClick={() => zoom(1.4)}>−</button>
          <button type="button" class="tool tool-fit" id="zoom-fit" aria-label="Fit the map to the screen" onClick={() => { setVbState(null); setOvr(centerKey); }}>Fit</button>
        </div>
      ) : null}
      {interactive && wide ? <p class="cartouche" aria-hidden="true">Railways of Corvenia, Ardesia and Varnholm<span>an invented atlas, spring 1914</span></p> : null}
      {over ? null : <div class="scale" aria-hidden="true"><span class="scale-bar" style={{ width: `${Math.round(60 / k)}px` }} /><span class="scale-t">one hour by express</span></div>}
    </div>
  );
}
