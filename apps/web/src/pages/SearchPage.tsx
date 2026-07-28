import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { EmptyBlock, ErrorBlock } from '../components/StateBlocks';
import { apiGet } from '../lib/api';
import type { SearchResult } from '../types';

interface SearchResponse {
  mode: 'baseline' | 'semantic';
  results: SearchResult[];
}

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchResult[]>([]);
  const [mode, setMode] = useState<'baseline' | 'semantic'>('baseline');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiGet<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`);
      setItems(data.results);
      setMode(data.mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-4">
      <article className="panel">
        <h2 className="panel-title">Reader search</h2>
        <p className="panel-copy">Mode: {mode}. Semantic mode is intentionally placeholder in Phase 1.</p>

        <form className="mt-4 flex gap-3" onSubmit={onSubmit}>
          <input
            className="field-input"
            placeholder="Try: rapid release blurbs"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {query.trim().length === 0 ? (
          <p className="mt-3 text-sm text-muted">Enter a question or concept to begin retrieval testing.</p>
        ) : null}
      </article>

      {error ? (
        <ErrorBlock detail={error} title="Search failed" />
      ) : loading ? (
        <article className="panel text-muted">Searching baseline index...</article>
      ) : items.length === 0 ? (
        <EmptyBlock detail="No results matched this query in the baseline contract dataset." title="No search results" />
      ) : (
        items.map((item) => (
          <article key={item.id} className="panel">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-muted">{item.snippet}</p>
            <p className="mt-2 text-sm text-muted">
              Source: {item.sourceType} | Attributed authority: {item.attributedAuthority}
            </p>
            <div className="mt-4 flex gap-3">
              <Link className="btn-secondary" to={`/submissions/${item.id}`}>
                Open source detail
              </Link>
              <Link className="btn-secondary" to="/features/semantic-search">
                Semantic placeholder
              </Link>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
