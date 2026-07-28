import type { ReactNode } from 'react';
import { usePersona } from './PersonaProvider';
import type { Persona } from '../types';

const labels: Record<Persona, string> = {
  contributor: 'Contributor',
  reader: 'Reader',
  curator: 'Curator',
  'authority-owner': 'Authority Owner'
};

interface PersonaGateProps {
  allowed: Persona[];
  title: string;
  children: ReactNode;
}

export function PersonaGate({ allowed, title, children }: PersonaGateProps) {
  const { persona, setPersona } = usePersona();

  if (allowed.includes(persona)) {
    return <>{children}</>;
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Persona mismatch</h2>
      <p className="panel-copy">
        {title} is scoped to {allowed.map((value) => labels[value]).join(' / ')}, but the active testing persona is{' '}
        {labels[persona]}.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {allowed.map((value) => (
          <button className="btn-primary" key={value} onClick={() => setPersona(value)} type="button">
            Switch to {labels[value]}
          </button>
        ))}
      </div>
    </section>
  );
}
