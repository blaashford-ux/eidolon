import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import { CLERK_ENABLED, CLERK_PUBLISHABLE_KEY } from './lib/config';
import './styles.css';

async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass'
    });
  }
}

await enableMocking();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {CLERK_ENABLED ? (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
