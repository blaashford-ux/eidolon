import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import type { Persona } from '../types';

interface ChecklistItem {
  id: string;
  label: string;
  to: string;
  personas: Persona[];
}

const items: ChecklistItem[] = [
  { id: 'con-1', label: 'Contributor: open new submission and validate required fields', to: '/submissions/new', personas: ['contributor'] },
  { id: 'con-2', label: 'Contributor: open submission details and review semantic/graph preview links', to: '/submissions/sub-101', personas: ['contributor', 'reader'] },
  { id: 'rea-1', label: 'Reader: run search query and inspect source metadata', to: '/search', personas: ['reader'] },
  { id: 'rea-2', label: 'Reader: open graph preview and return through search navigation', to: '/graph', personas: ['reader'] },
  { id: 'cur-1', label: 'Curator: review queue item and simulate approve/reject', to: '/moderation', personas: ['curator'] },
  { id: 'aut-1', label: 'Authority Owner: claim profile and inspect endorsement history', to: '/authority', personas: ['authority-owner'] }
];

const STORAGE_KEY = 'eidolon.phase2.checklist';

function readInitial() {
  if (typeof window === 'undefined') {
    return {} as Record<string, boolean>;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {} as Record<string, boolean>;
  }
}

export function JourneyChecklist() {
  const [state, setState] = useState<Record<string, boolean>>(() => readInitial());

  const completion = useMemo(() => {
    const total = items.length;
    const done = items.filter((item) => state[item.id]).length;
    return { total, done };
  }, [state]);

  function toggle(id: string) {
    setState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }

  return (
    <article className="panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">Phase 2 journey checklist</h3>
        <span className="status-chip">
          {completion.done}/{completion.total} complete
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">Use this tracker while validating all persona stories in the browser.</p>

      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <label className="check-row" key={item.id}>
            <input checked={Boolean(state[item.id])} onChange={() => toggle(item.id)} type="checkbox" />
            <span className="text-sm text-slate-100">{item.label}</span>
            <Link className="btn-secondary ml-auto" to={item.to}>
              Open
            </Link>
          </label>
        ))}
      </div>
    </article>
  );
}
