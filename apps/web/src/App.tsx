import { BookOpen, Brain, Network, ShieldCheck } from 'lucide-react';

const cards = [
  {
    title: 'Preserve provenance',
    description: 'Keep original knowledge, attribution, and source context intact.'
  },
  {
    title: 'Weight by authority',
    description: 'Use authority level snapshots without collapsing private users into public identities.'
  },
  {
    title: 'Expand incrementally',
    description: 'Start with topics and reveal the graph in controlled layers.'
  }
];

export default function App() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_45%),linear-gradient(180deg,#07111f_0%,#0a1020_55%,#050816_100%)] text-text">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-line/70 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted">Eidolon</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Community knowledge graph</h1>
          </div>
          <div className="rounded-full border border-line/70 bg-panel/60 px-4 py-2 text-sm text-muted shadow-glow backdrop-blur">
            Local scaffold ready
          </div>
        </header>

        <section className="grid flex-1 gap-8 py-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm text-accent">
              <Brain size={16} />
              React, Workers, D1, Vectorize, R2
            </p>
            <h2 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              A provenance-first foundation for AI-assisted discovery.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              This workspace is wired for incremental graph exploration, Cloudflare-native APIs, and editable AI metadata.
              The next steps are account setup and resource provisioning.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white" href="#status">
                View setup status
              </a>
              <a className="rounded-full border border-line/70 px-5 py-3 text-sm font-medium text-white/90" href="#checklist">
                Open checklist
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-line/80 bg-panel/70 p-6 shadow-glow backdrop-blur">
            <div className="grid gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-line/60 bg-white/5 p-4">
                <Network className="text-accent" size={20} />
                <div>
                  <p className="font-medium text-white">Incremental graph</p>
                  <p className="text-sm text-muted">Topics first, then chunk and authority expansion.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-line/60 bg-white/5 p-4">
                <ShieldCheck className="text-accent" size={20} />
                <div>
                  <p className="font-medium text-white">Cloudflare bound</p>
                  <p className="text-sm text-muted">Wrangler config is in place; account IDs still need to be added.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-line/60 bg-white/5 p-4">
                <BookOpen className="text-accent" size={20} />
                <div>
                  <p className="font-medium text-white">Schema ready</p>
                  <p className="text-sm text-muted">D1 tables are scaffolded in the shared DB package.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="status" className="grid gap-4 py-8 md:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="rounded-3xl border border-line/70 bg-panel/60 p-6">
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
            </article>
          ))}
        </section>

        <section id="checklist" className="rounded-3xl border border-line/70 bg-panel/60 p-6 text-sm text-muted">
          <p className="font-medium text-white">Remaining manual steps</p>
          <p className="mt-2">Create the Git remote, run Wrangler login, and provision D1, R2, Vectorize, and Pages resources.</p>
        </section>
      </div>
    </main>
  );
}
