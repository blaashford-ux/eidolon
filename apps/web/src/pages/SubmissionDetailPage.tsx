import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { apiGet } from '../lib/api';
import type { Submission } from '../types';

export function SubmissionDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Submission | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    apiGet<Submission>(`/api/submissions/${id}`)
      .then((data) => setItem(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  if (!id) {
    return <EmptyBlock detail="No submission id was provided in the route." title="Missing submission id" />;
  }

  if (loading) {
    return <LoadingBlock detail="Loading source chunk and attribution details." title="Loading submission" />;
  }

  if (error) {
    return <ErrorBlock detail={error} onRetry={load} title="Submission unavailable" />;
  }

  if (!item) {
    return <EmptyBlock detail="The submission no longer exists in the current dataset." title="Submission not found" />;
  }

  return (
    <section className="panel">
      <h2 className="panel-title">{item.title}</h2>
      <p className="mt-2 text-sm text-muted">Status: {item.status}</p>
      <p className="mt-4 text-sm leading-7 text-slate-200">{item.content}</p>
      <div className="mt-6 grid gap-2 text-sm text-muted">
        <p>Source type: {item.sourceType}</p>
        <p>Source URL: {item.sourceUrl || 'Not provided'}</p>
        <p>Contributor: {item.contributor}</p>
        <p>Attributed authority: {item.attributedAuthority}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="btn-secondary" to="/features/semantic-ranking">
          View semantic ranking preview
        </Link>
        <Link className="btn-secondary" to="/features/graph-expansion">
          Open graph expansion preview
        </Link>
      </div>
    </section>
  );
}
