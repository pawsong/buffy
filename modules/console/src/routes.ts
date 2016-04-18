import { Store } from 'redux';
import { State } from './reducers';

import RootHandler from './screens/Root';
import JoinHandler from './screens/Join';
import LoginHandler from './screens/Login';
import AnonymousHandler from './screens/Anonymous';
import AnonymousIndexHandler from './screens/Anonymous/screens/Index';
import LoggedInHandler from './screens/LoggedIn';
import LoggedInIndexHandler from './screens/LoggedIn/screens/Index';
import AboutHandler from './screens/About';
import ContactHandler from './screens/Contact';
import GetStartedHandler from './screens/GetStarted';
import OnlineStudioHandler from './screens/OnlineStudio';
import OnlineCardboardHandler from './screens/OnlineCardboard';
import ProjectStudioHandler from './screens/ProjectStudio';
import ProjectCardboardHandler from './screens/ProjectCardboard';
import ProfileHandler from './screens/Profile';
import SettingsHandler from './screens/Settings';
import NotFoundHandler from './screens/NotFound';

export default function getRoutes(store: Store) {

  function isLoggedIn() {
    const state: State = store.getState();
    return !!state.auth.userid;
  }

  function redirectToLogin(nextState, replace) {
    if (!isLoggedIn()) replace('/login');
  }

  function redirectToDashboard(nextState, replace) {
    if (isLoggedIn()) replace('/');
  }

  return {
    component: RootHandler,
    childRoutes: [
      {
        onEnter: redirectToDashboard,
        childRoutes: [
          // Unauthenticated routes
          // Redirect to dashboard if user is already logged in
          {
            path: '/join',
            getComponent: (location, cb) => {
              return require.ensure([], require => {
                cb(null, require<{ default: JoinHandler }>('./screens/Join').default);
              });
            },
          },
          {
            path: '/login',
            getComponent: (location, cb) => {
              return require.ensure([], require => {
                cb(null, require<{ default: JoinHandler }>('./screens/Login').default);
              });
            },
          },
        ],
      },
      {
        path: '/create',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: ProjectStudioHandler }>('./screens/ProjectStudio').default);
        }),
      },
      {
        path: '/@/:projectId/:revision/edit',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: ProjectStudioHandler }>('./screens/ProjectStudio').default);
        }),
      },
      {
        path: '/@:username/:projectId/:revision/edit',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: ProjectStudioHandler }>('./screens/ProjectStudio').default);
        }),
      },
      {
        path: '/@/:projectId/:revision/vr',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: ProjectCardboardHandler }>('./screens/ProjectCardboard').default);
        }),
      },
      {
        path: '/@:username/:projectId/:revision/vr',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: ProjectCardboardHandler }>('./screens/ProjectCardboard').default);
        }),
      },
      {
        path: '/connect',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: OnlineStudioHandler }>('./screens/OnlineStudio').default);
        }),
      },
      {
        path: '/connect/vr',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: OnlineCardboardHandler }>('./screens/OnlineCardboard').default);
        }),
      },
      {
        path: '/',
        getComponent: (location, cb) => {
          if (!isLoggedIn()) {
            return require.ensure([], require => {
              cb(null, require<{ default: AnonymousHandler }>('./screens/Anonymous').default);
            });
          } else {
            return require.ensure([], require => {
              cb(null, require<{ default: LoggedInHandler }>('./screens/LoggedIn').default);
            });
          }
        },
        indexRoute: {
          getComponent: (location, cb) => {
            if (!isLoggedIn()) {
              return require.ensure([], (require) => {
                cb(null, require<{ default: AnonymousIndexHandler }>('./screens/Anonymous/screens/Index').default);
              });
            } else {
              return require.ensure([], (require) => {
                cb(null, require<{ default: LoggedInIndexHandler }>('./screens/LoggedIn/screens/Index').default);
              });
            }
          }
        },
        childRoutes: [
          {
            onEnter: redirectToLogin,
            path: '/settings',
            getComponent: (location, cb) => {
              return require.ensure([], require => {
                cb(null, require<{ default: SettingsHandler }>('./screens/Settings').default);
              });
            },
          },
          {
            path: '/@:username',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: ProfileHandler }>('./screens/Profile').default);
            }),
          },
          {
            path: '/about',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: AboutHandler }>('./screens/About').default);
            }),
          },
          {
            path: '/contact',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: ContactHandler }>('./screens/Contact').default);
            }),
          },
          {
            path: '/get-started',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: GetStartedHandler }>('./screens/GetStarted').default);
            }),
          },
          {
            path: '*',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: NotFoundHandler }>('./screens/NotFound').default);
            }),
          },
        ],
      },
    ]
  };
};
