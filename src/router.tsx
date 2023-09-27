import { Navigate } from 'react-router-dom';
import { RouteObject } from 'react-router';
import { Loader } from 'src/components/SuspenseLoader/Loader';
import { lazy } from 'react';


const PublicMap = Loader(lazy(() => import('src/content/publicMap/PublicMap')));

const routes: RouteObject[] = [
  { path: `maps`, element: <PublicMap /> },
  { path: '/', element: <Navigate to="maps" replace /> },
];

export default routes;
