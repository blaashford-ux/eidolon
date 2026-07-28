import { Link } from 'react-router-dom';

export function GraphPage() {
  return (
    <section className="panel">
      <h2 className="panel-title">Graph explorer (Phase 1 placeholder)</h2>
      <p className="panel-copy">
        Topic-first incremental graph rendering is scheduled for Phase 3. This route exists now so Reader and
        Contributor flows remain complete and non-blocking.
      </p>
      <div className="mt-5 flex gap-3">
        <Link className="btn-secondary" to="/features/graph-expansion">
          Topic expansion placeholder
        </Link>
        <Link className="btn-secondary" to="/search">
          Return to search
        </Link>
      </div>
    </section>
  );
}
