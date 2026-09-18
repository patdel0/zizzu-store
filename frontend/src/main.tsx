import React, { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';

import './index.css';
import router from './router';

const rootContainer = document.getElementById('root');
if (!rootContainer) {
  throw new Error('Root element not found in the DOM');
}

createRoot(rootContainer).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
