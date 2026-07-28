import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CLERK_ENABLED } from '../lib/config';
import { usePersona } from './PersonaProvider';
import type { Persona } from '../types';

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/submissions', label: 'Submissions' },
  { to: '/search', label: 'Search' },
  { to: '/graph', label: 'Graph' },
  { to: '/moderation', label: 'Moderation' },
  { to: '/authority', label: 'Authority' }
];

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { persona, setPersona } = usePersona();

  function onPersonaChange(value: string) {
    setPersona(value as Persona);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.2),_transparent_40%),linear-gradient(180deg,#07111f_0%,#0b1328_60%,#060916_100%)] text-text">
      <header className="border-b border-line/70 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Eidolon</p>
            <h1 className="text-xl font-semibold text-white">Phase 1 UX Sandbox</h1>
          </div>

          <button
            className="rounded-xl border border-line/70 p-2 text-muted sm:hidden"
            type="button"
            onClick={() => setOpen((prev) => !prev)}
          >
            <Menu size={18} />
          </button>

          <nav className="hidden items-center gap-2 sm:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm ${isActive ? 'bg-accent text-white' : 'text-muted hover:text-white'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <label className="text-xs uppercase tracking-[0.15em] text-muted">
              Persona
              <select className="ml-2 rounded-lg border border-line/70 bg-black/30 px-2 py-1 text-sm text-slate-100" value={persona} onChange={(event) => onPersonaChange(event.target.value)}>
                <option value="reader">Reader</option>
                <option value="contributor">Contributor</option>
                <option value="curator">Curator</option>
                <option value="authority-owner">Authority Owner</option>
              </select>
            </label>

            {CLERK_ENABLED ? (
              <>
                <SignedIn>
                  <UserButton />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="btn-primary" type="button">
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>
              </>
            ) : (
              <div className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
                Clerk key missing
              </div>
            )}
          </div>
        </div>

        {open ? (
          <nav className="mx-auto grid max-w-7xl gap-2 border-t border-line/70 px-4 py-3 sm:hidden">
            <label className="mb-1 text-xs uppercase tracking-[0.15em] text-muted">
              Persona
              <select className="mt-2 w-full rounded-lg border border-line/70 bg-black/30 px-3 py-2 text-sm text-slate-100" value={persona} onChange={(event) => onPersonaChange(event.target.value)}>
                <option value="reader">Reader</option>
                <option value="contributor">Contributor</option>
                <option value="curator">Curator</option>
                <option value="authority-owner">Authority Owner</option>
              </select>
            </label>

            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-accent text-white' : 'text-muted hover:text-white'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
