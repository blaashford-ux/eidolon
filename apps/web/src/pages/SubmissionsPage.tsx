import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { apiGet } from '../lib/api';
import type { Submission } from '../types';

interface SubmissionResponse {
  submissions: Submission[];
}

export function SubmissionsPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  function load() {
    setLoading(true);
    setError('');
    apiGet<SubmissionResponse>('/api/submissions')
      .then((data) => setItems(data.submissions))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <LoadingBlock detail="Pulling contributor submissions and status history." title="Loading submissions" />;
  }

  if (error) {
    return <ErrorBlock detail={`Could not load submissions: ${error}`} onRetry={load} title="Submissions unavailable" />;
  }

  if (items.length === 0) {
    return <EmptyBlock detail="No submissions exist yet. Start by creating a new chunk." title="No submissions" />;
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Contributor submissions</h2>
        <Link className="btn-primary" to="/submissions/new">
          New submission
        </Link>
      </div>

      {items.map((item) => (
        <article key={item.id} className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <span className="status-chip">{item.status}</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            Source: {item.sourceType} | Attributed authority: {item.attributedAuthority}
          </p>
          <p className="mt-2 text-sm text-muted">Contributor: {item.contributor}</p>
          <div className="mt-4">
            <Link className="btn-secondary" to={`/submissions/${item.id}`}>
              View details
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
