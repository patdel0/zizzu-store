import React from 'react';

import { Link, Outlet } from 'react-router';

const RootLayout: React.FC = () => (
  <React.Fragment>
    <nav>
      <Link to="/">Home</Link>
    </nav>
    <Outlet />
  </React.Fragment>
);

export default RootLayout;
