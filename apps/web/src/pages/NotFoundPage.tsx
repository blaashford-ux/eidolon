import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="panel">
      <h2 className="panel-title">Route not found</h2>
      <p className="panel-copy">This route is outside the current phase scope.</p>
      <Link className="btn-primary mt-4 inline-flex" to="/">
        Back to dashboard
      </Link>
    </section>
  );
}
