import { Link } from 'react-router-dom';

interface FeaturePlaceholderProps {
  title: string;
  summary: string;
  routeHint: string;
}

export function FeaturePlaceholder({ title, summary, routeHint }: FeaturePlaceholderProps) {
  return (
    <section className="panel">
      <h2 className="panel-title">{title}</h2>
      <p className="panel-copy">{summary}</p>
      <p className="text-xs uppercase tracking-[0.25em] text-muted">Current route: {routeHint}</p>
      <div className="mt-5 flex gap-3">
        <Link className="btn-primary" to="/">
          Back to dashboard
        </Link>
        <Link className="btn-secondary" to="/search">
          Open search
        </Link>
      </div>
    </section>
  );
}
