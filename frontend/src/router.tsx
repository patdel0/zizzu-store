import { createBrowserRouter } from 'react-router';

import { Dashboard } from './layouts/Dashboard';
import { RootLayout } from './layouts/RootLayout';
import { NewProduct } from './pages/Dashboard/NewProduct';
import { Home } from './pages/Home';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      {
        path: '/dashboard',
        Component: Dashboard,
        children: [
          { path: 'new', Component: NewProduct },
        ],
      },
    ],
  },
]);
