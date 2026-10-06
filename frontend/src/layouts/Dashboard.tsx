import { Link, Outlet } from 'react-router';

import type { FC } from 'react';

export const Dashboard: FC = () => (
  <div>
    <Link to="/dashboard/new">New product</Link>
    <h1>Dashboard</h1>
    <Outlet />
  </div>
);
