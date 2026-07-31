import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { JourneyChecklist } from '../components/JourneyChecklist';
import { ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { apiGet } from '../lib/api';
import type { CapabilityMap } from '../types';

const cards = [
  {
    title: 'Contributor',
    copy: 'Submit chunks, review submission states, and inspect provenance fields.',
    to: '/submissions/new'
  },
  {
    title: 'Reader',
    copy: 'Search and inspect source-backed entries with baseline and semantic-mode indicators.',
    to: '/search'
  },
  {
    title: 'Curator',
    copy: 'Review moderation queue actions with explicit quality and duplicate-check hints.',
    to: '/moderation'
  },
  {
    title: 'Authority Owner',
    copy: 'Navigate profile claim and endorsement surfaces through route-guarded UX.',
    to: '/authority'
  }
];

export function DashboardPage() {
  const [caps, setCaps] = useState<CapabilityMap | null>(null);
  const [loadingCaps, setLoadingCaps] = useState(true);
  const [capError, setCapError] = useState('');

  useEffect(() => {
    apiGet<CapabilityMap>('/api/capabilities')
      .then((value) => setCaps(value))
      .catch((err: Error) => setCapError(err.message))
      .finally(() => setLoadingCaps(false));
  }, []);

  return (
    <section className="grid gap-6">
      <article className="panel">
        <h2 className="panel-title">Phase 3 Objective</h2>
        <p className="panel-copy">
          Run core contributor and reader flows against the live Worker API, D1 persistence, and incremental graph
          exploration while preserving graceful fallback routes for not-yet-implemented advanced capabilities.
        </p>
      </article>

      {loadingCaps ? <LoadingBlock detail="Checking feature capabilities from the live API." title="Capabilities" /> : null}
      {!loadingCaps && capError ? <ErrorBlock detail={capError} title="Could not load capabilities" /> : null}
      {!loadingCaps && !capError && caps ? (
        <article className="panel">
          <h3 className="text-lg font-semibold text-white">Current capability matrix</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p className="text-sm text-muted">Graph runtime: {caps.graph ? 'Enabled' : 'Planned mode'}</p>
            <p className="text-sm text-muted">Semantic search: {caps.semanticSearch ? 'Enabled' : 'Planned mode'}</p>
            <p className="text-sm text-muted">Moderation automation: {caps.moderationAutomation ? 'Enabled' : 'Manual mode'}</p>
            <p className="text-sm text-muted">Synthesis: {caps.synthesis ? 'Enabled' : 'Planned mode'}</p>
          </div>
        </article>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <article key={card.title} className="panel">
            <h3 className="text-lg font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-muted">{card.copy}</p>
            <Link className="btn-secondary mt-4 inline-flex" to={card.to}>
              Open flow
            </Link>
          </article>
        ))}
      </section>

      <JourneyChecklist />
    </section>
  );
}
