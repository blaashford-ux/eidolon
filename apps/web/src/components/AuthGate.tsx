import { SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import type { ReactNode } from 'react';
import { CLERK_ENABLED } from '../lib/config';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  if (!CLERK_ENABLED) {
    return <>{children}</>;
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <section className="panel">
          <h2 className="panel-title">Sign in required</h2>
          <p className="panel-copy">This route is persona-scoped and requires an active Clerk session.</p>
          <SignInButton mode="modal">
            <button className="btn-primary" type="button">
              Sign in with Clerk
            </button>
          </SignInButton>
        </section>
      </SignedOut>
    </>
  );
}
