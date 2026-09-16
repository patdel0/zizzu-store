import React, { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

const rootContainer = document.getElementById('root');
if (!rootContainer) {
  throw new Error('Root element not found in the DOM');
}

createRoot(rootContainer).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
