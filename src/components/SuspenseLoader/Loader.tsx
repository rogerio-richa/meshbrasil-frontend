import SuspenseLoader from './index';
import { Suspense } from 'react';

export const Loader = (Component) => (props) =>
(
  <Suspense fallback={<SuspenseLoader />}>
    <Component {...props} />
  </Suspense>
);