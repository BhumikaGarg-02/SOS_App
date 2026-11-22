import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { applyIdentityFromStorage } from './lib/identity';

// Apply identity synchronously before first React render to prevent cold-start flash
applyIdentityFromStorage();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
