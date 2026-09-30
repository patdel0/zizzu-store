import { Fragment } from 'react';

import { Link, Outlet } from 'react-router';

import type { FC } from 'react';

export const RootLayout: FC = () => (
  <Fragment>
    <nav>
      <Link to="/">Home</Link>
    </nav>
    <Outlet />
  </Fragment>
);

export default RootLayout;
