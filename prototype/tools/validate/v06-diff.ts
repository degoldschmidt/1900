/**
 * V06 — cross-edition diff (informational). Within each source family, consecutive editions (by
 * valid_from) are compared train by train (train_key): trains added, withdrawn, retimed (a time
 * differs at a station both editions print for the train, all of its tables merged), and trains
 * whose running days changed (the parsed rules differ). Each pair is written to
 * build/reports/diff-<e1>-<e2>.md; these are the candidates for C07's stale-guide ("ghost") cases.
 */
import type { Dataset } from '../schema/dataset.ts';
import type { ServiceRow, StopRow } from '../schema/canonical.ts';
import { groupBy, stopsByService } from '../schema/derive.ts';
import { parseRule, ruleKey } from '../schema/running-rule.ts';
import { cmpStr } from '../schema/csv.ts';
import { isoFromDay } from '#kit/time/calendar.ts';
import { issue, type Issue } from '../schema/issues.ts';

export interface DiffReport { file: string; text: string }

interface TrainView { services: ServiceRow[]; stations: Map<string, { arr: string; dep: string }>; rule: string; ruleText: string }

function views(services: readonly ServiceRow[], sbs: Map<string, StopRow[]>): Map<string, TrainView> {
  const out = new Map<string, TrainView>();
  for (const [key, list] of groupBy(services, (s) => s.train_key)) {
    const sorted = [...list].sort((a, b) => cmpStr(a.service_id, b.service_id));
    const stations = new Map<string, { arr: string; dep: string }>();
    for (const s of sorted) {
      for (const st of sbs.get(s.service_id) ?? []) {
        const cur = stations.get(st.station_id) ?? { arr: '', dep: '' };
        stations.set(st.station_id, { arr: cur.arr || st.arr_local, dep: cur.dep || st.dep_local });
      }
    }
    const texts = [...new Set(sorted.map((s) => s.running_rule))].sort(cmpStr);
    const keys = texts.map((t) => { const p = parseRule(t); return p.ok ? ruleKey(p.rule) : `invalid:${t}`; });
    out.set(key, { services: sorted, stations, rule: [...new Set(keys)].sort(cmpStr).join(' | '), ruleText: texts.join(' | ') });
  }
  return out;
}

export function v06(ds: Dataset): { issues: Issue[]; reports: DiffReport[] } {
  const issues: Issue[] = [];
  const reports: DiffReport[] = [];
  const sbs = stopsByService(ds);
  const byFamily = groupBy(ds.t.editions, (e) => e.family);
  for (const fam of [...byFamily.keys()].sort(cmpStr)) {
    const eds = [...byFamily.get(fam)!].sort((a, b) => a.valid_from - b.valid_from || cmpStr(a.edition_id, b.edition_id));
    for (let i = 0; i + 1 < eds.length; i++) {
      const e1 = eds[i]!; const e2 = eds[i + 1]!;
      const v1 = views(ds.t.services.filter((s) => s.edition_id === e1.edition_id), sbs);
      const v2 = views(ds.t.services.filter((s) => s.edition_id === e2.edition_id), sbs);
      const keys = [...new Set([...v1.keys(), ...v2.keys()])].sort(cmpStr);
      const added: string[] = []; const withdrawn: string[] = []; const retimed: string[] = []; const days: string[] = [];
      for (const k of keys) {
        const a = v1.get(k); const b = v2.get(k);
        if (!a && b) { added.push(`- ${k} (${b.services.map((s) => s.table_ref).join(', ')})`); continue; }
        if (a && !b) { withdrawn.push(`- ${k} (${a.services.map((s) => s.table_ref).join(', ')})`); continue; }
        if (!a || !b) continue;
        const changes: string[] = [];
        for (const st of [...a.stations.keys()].filter((x) => b.stations.has(x)).sort(cmpStr)) {
          const x = a.stations.get(st)!; const y = b.stations.get(st)!;
          if (x.arr && y.arr && x.arr !== y.arr) changes.push(`${st} arr ${x.arr}→${y.arr}`);
          if (x.dep && y.dep && x.dep !== y.dep) changes.push(`${st} dep ${x.dep}→${y.dep}`);
        }
        if (changes.length) retimed.push(`- ${k}: ${changes.join('; ')}`);
        if (a.rule !== b.rule) days.push(`- ${k}: \`${a.ruleText}\` → \`${b.ruleText}\``);
      }
      const sec = (title: string, l: string[]) => `## ${title} (${l.length})\n\n${l.length ? l.join('\n') : '(none)'}\n`;
      const text = [
        `# Timetable changes ${e1.edition_id} → ${e2.edition_id}\n`,
        `Family ${fam}: ${e1.label} (valid from ${isoFromDay(e1.valid_from)}) to ${e2.label} (valid from ${isoFromDay(e2.valid_from)}).\n`,
        sec('Added', added), sec('Withdrawn', withdrawn), sec('Retimed', retimed), sec('Running days changed', days),
      ].join('\n');
      const file = `diff-${e1.edition_id}-${e2.edition_id}.md`;
      reports.push({ file, text });
      issues.push(issue('V06', 'info', `editions ${e1.edition_id}→${e2.edition_id}`,
        `${added.length} added, ${withdrawn.length} withdrawn, ${retimed.length} retimed, ${days.length} running days changed (${file})`));
    }
  }
  return { issues, reports };
}
