import { createElement } from 'react';

import { createBrowserRouter } from 'react-router';

import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';

const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
  },
]);

export default router;
