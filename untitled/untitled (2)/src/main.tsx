import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { runDevStorageCleanup } from './lib/storage';

// Execute one-time cleanup for any legacy development records
runDevStorageCleanup();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
