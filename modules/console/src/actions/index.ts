import { push } from 'react-router-redux';

export interface Action<T> {
  type: T;
}

export function moveToLoginPage(location: HistoryModule.LocationDescriptorObject) {
  return push({
    pathname: '/login',
    query: {
      n: JSON.stringify({
        p: location.pathname,
        q: location.query,
      }),
    },
  });
}
