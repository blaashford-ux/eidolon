import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { apiGet, apiPost } from '../lib/api';
import type { ModerationItem } from '../types';

export function ModerationDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<ModerationItem | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  function load() {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    apiGet<ModerationItem>(`/api/moderation/queue/${id}`)
      .then(setItem)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function mutate(action: 'approve' | 'reject') {
    if (!id) {
      return;
    }

    setMutating(true);
    setError('');
    try {
      const result = await apiPost<{ ok: boolean; item: ModerationItem }>(`/api/moderation/${id}/${action}`, {});
      setItem(result.item);
      setMessage(action === 'approve' ? 'Item approved in moderation queue.' : 'Item rejected in moderation queue.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setMutating(false);
    }
  }

  if (!id) {
    return <EmptyBlock detail="No moderation item id was provided." title="Missing queue item id" />;
  }

  if (loading) {
    return <LoadingBlock detail="Loading moderation context and review hints." title="Loading moderation item" />;
  }

  if (error && !item) {
    return <ErrorBlock detail={error} onRetry={load} title="Could not load moderation item" />;
  }

  if (!item) {
    return <EmptyBlock detail="The queue item no longer exists in the current dataset." title="Queue item not found" />;
  }

  return (
    <section className="panel">
      <h2 className="panel-title">{item.title}</h2>
      <p className="mt-2 text-sm text-muted">Status: {item.status}</p>

      <div className="mt-5 grid gap-3 text-sm text-muted">
        <p>Duplicate assist: {item.duplicateHint}</p>
        <p>Quality assist: {item.qualityHint}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-primary" disabled={mutating} onClick={() => mutate('approve')} type="button">
          {mutating ? 'Applying...' : 'Approve'}
        </button>
        <button className="btn-secondary" disabled={mutating} onClick={() => mutate('reject')} type="button">
          Reject
        </button>
      </div>

      <p className="mt-4 text-sm text-emerald-300">{message}</p>
      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
    </section>
  );
}
