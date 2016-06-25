import { Store } from 'redux';
import { State } from './reducers';

import RootHandler from './screens/Root';
import JoinHandler from './screens/Join';
import LoginHandler from './screens/Login';
import AnonymousHandler from './screens/Anonymous';
// import AnonymousIndexHandler from './screens/Anonymous/screens/Index';
import LoggedInHandler from './screens/LoggedIn';
// import LoggedInIndexHandler from './screens/LoggedIn/screens/Index';
import AboutHandler from './screens/About';
import ContactHandler from './screens/Contact';
// import GetStartedHandler from './screens/GetStarted';
// import OnlineStudioHandler from './screens/OnlineStudio';
// import OnlineCardboardHandler from './screens/OnlineCardboard';
// import OnlineGameHandler from './screens/OnlineGame';
// import ProjectStudioHandler from './screens/ProjectStudio';
// import ProjectCardboardHandler from './screens/ProjectCardboard';
// import ProjectGameHandler from './screens/ProjectGame';
import ProfileHandler from './screens/Profile';
import SettingsHandler from './screens/Settings';
import SettingsProfileHandler from './screens/Settings/screens/Profile';
import SettingsAccountHandler from './screens/Settings/screens/Account';
import NotFoundHandler from './screens/NotFound';
import ModelStudioHandler from './screens/ModelStudio';
import ModelHandler from './screens/Model';
import ModelViewerHandler from './screens/ModelViewer';
import UnsupportedOnMobileHandler from './screens/UnsupportedOnMobile';

export default function getRoutes(store: Store, isMobile: boolean) {

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
                cb(null, require<{ default: LoginHandler }>('./screens/Login').default);
              });
            },
          },
        ],
      },
      {
        onEnter: (nextState, replace) => {
          if (isMobile) replace('/model/edit/unsupported');
        },
        path: '/model/edit',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: ModelStudioHandler }>('./screens/ModelStudio').default);
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
          onEnter: (nextState, replace) => replace('/model'),
          // getComponent: (location, cb) => {
          //   if (!isLoggedIn()) {
          //     return require.ensure([], (require) => {
          //       cb(null, require<{ default: AnonymousIndexHandler }>('./screens/Anonymous/screens/Index').default);
          //     });
          //   } else {
          //     return require.ensure([], (require) => {
          //       cb(null, require<{ default: LoggedInIndexHandler }>('./screens/LoggedIn/screens/Index').default);
          //     });
          //   }
          // }
        },
        childRoutes: [
          {
            path: '/model',
            getComponent: (location, cb) => {
              return require.ensure([], require => {
                cb(null, require<{ default: ModelHandler }>('./screens/Model').default);
              });
            },
          },
          {
            path: '/model/:modelId',
            getComponent: (location, cb) => {
              return require.ensure([], require => {
                cb(null, require<{ default: ModelViewerHandler }>('./screens/ModelViewer').default);
              });
            },
          },
          {
            onEnter: redirectToLogin,
            path: '/settings',
            getComponent: (location, cb) => {
              return require.ensure([], require => {
                cb(null, require<{ default: SettingsHandler }>('./screens/Settings').default);
              });
            },
            indexRoute: {
              onEnter: (nextState, replace) => replace('/settings/profile'),
            },
            childRoutes: [
              {
                path: 'profile',
                getComponent: (location, cb) => {
                  return require.ensure([], require => {
                    cb(null, require<{ default: SettingsProfileHandler }>('./screens/Settings/screens/Profile').default);
                  });
                },
              },
              {
                path: 'account',
                getComponent: (location, cb) => {
                  return require.ensure([], require => {
                    cb(null, require<{ default: SettingsAccountHandler }>('./screens/Settings/screens/Account').default);
                  });
                },
              },
            ],
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
            path: '/model/edit/unsupported',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: UnsupportedOnMobileHandler }>('./screens/UnsupportedOnMobile').default);
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
