import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Persona } from '../types';

interface PersonaContextValue {
  persona: Persona;
  setPersona: (value: Persona) => void;
}

const STORAGE_KEY = 'eidolon.phase1.persona';

const PersonaContext = createContext<PersonaContextValue | null>(null);

function readStoredPersona(): Persona {
  if (typeof window === 'undefined') {
    return 'reader';
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'contributor' || raw === 'reader' || raw === 'curator' || raw === 'authority-owner') {
    return raw;
  }
  return 'reader';
}

interface PersonaProviderProps {
  children: ReactNode;
}

export function PersonaProvider({ children }: PersonaProviderProps) {
  const [persona, setPersonaState] = useState<Persona>(() => readStoredPersona());

  function setPersona(value: Persona) {
    setPersonaState(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  }

  const value = useMemo(() => ({ persona, setPersona }), [persona]);
  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    throw new Error('usePersona must be used inside PersonaProvider.');
  }
  return ctx;
}
