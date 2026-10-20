import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline support safely
try {
  registerSW({ immediate: true });
} catch {
  // Ignore SW registration errors when HMR is disabled in preview
}

createRoot(document.getElementById('root')!).render(<App />);
