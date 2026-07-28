import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { apiGet } from '../lib/api';
import type { ModerationItem } from '../types';

interface QueueResponse {
  items: ModerationItem[];
}

export function ModerationQueuePage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    apiGet<QueueResponse>('/api/moderation/queue')
      .then((data) => setItems(data.items))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <LoadingBlock detail="Fetching moderation queue and status buckets." title="Loading queue" />;
  }

  if (error) {
    return <ErrorBlock detail={error} onRetry={load} title="Queue unavailable" />;
  }

  if (items.length === 0) {
    return <EmptyBlock detail="No queue items are currently pending review." title="Queue is empty" />;
  }

  return (
    <section className="grid gap-4">
      <article className="panel">
        <h2 className="panel-title">Curation moderation queue</h2>
        <p className="panel-copy">Use this flow to test status filters, action states, and duplicate-check placeholders.</p>
      </article>

      {items.map((item) => (
        <article className="panel" key={item.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <span className="status-chip">{item.status}</span>
          </div>
          <p className="mt-2 text-sm text-muted">Submitted by {item.submittedBy}</p>
          <div className="mt-4 flex gap-3">
            <Link className="btn-secondary" to={`/moderation/${item.id}`}>
              Review item
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
