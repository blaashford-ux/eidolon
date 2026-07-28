interface LoadingBlockProps {
  title: string;
  detail?: string;
}

export function LoadingBlock({ title, detail }: LoadingBlockProps) {
  return (
    <section className="panel">
      <h2 className="panel-title">{title}</h2>
      <p className="panel-copy">{detail || 'Loading state in progress.'}</p>
    </section>
  );
}

interface ErrorBlockProps {
  title: string;
  detail: string;
  onRetry?: () => void;
}

export function ErrorBlock({ title, detail, onRetry }: ErrorBlockProps) {
  return (
    <section className="panel border-rose-500/40 bg-rose-950/20">
      <h2 className="panel-title">{title}</h2>
      <p className="panel-copy text-rose-200">{detail}</p>
      {onRetry ? (
        <div className="mt-4">
          <button className="btn-secondary" onClick={onRetry} type="button">
            Retry
          </button>
        </div>
      ) : null}
    </section>
  );
}

interface EmptyBlockProps {
  title: string;
  detail: string;
}

export function EmptyBlock({ title, detail }: EmptyBlockProps) {
  return (
    <section className="panel border-dashed border-line/75 bg-black/20">
      <h2 className="panel-title">{title}</h2>
      <p className="panel-copy">{detail}</p>
    </section>
  );
}
