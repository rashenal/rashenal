import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { UserProvider } from '@contexts/userContext'; // ✅ Match file casing
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </StrictMode>
);
