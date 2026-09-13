import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { hydrateFromServer } from './utils/api';
import { ensureInitialized } from './utils/storage';

// Ensure local seeds exist, then try to hydrate from the PostgreSQL API
// before first render. If the server is down the app runs on localStorage.
ensureInitialized();

hydrateFromServer().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
