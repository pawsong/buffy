import { Store } from 'redux';
import { State } from './reducers';

import axios from 'axios';

import RootHandler from './screens/Root';
import JoinHandler from './screens/Join';
import LoginHandler from './screens/Login';
import AnonymousHandler from './screens/Anonymous';
// import AnonymousIndexHandler from './screens/Anonymous/screens/Index';
import LoggedInHandler from './screens/LoggedIn';
// import LoggedInIndexHandler from './screens/LoggedIn/screens/Index';
import AboutHandler from './screens/About';
import ContactHandler from './screens/Contact';
import DesignTutorial from './screens/Tutorial/screens/DesignTutorial';
import DesignTutorialIndex from './screens/Tutorial/screens/DesignTutorialIndex';
import DesignTutorialSlugs from './screens/Tutorial/screens/DesignTutorial/slugs';
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
import ModelViewerIndexHandler from './screens/ModelViewer/screens/Index';
import ModelViewerLikesHandler from './screens/ModelViewer/screens/Likes';
import ModelVeiwerSettingsHandler from './screens/ModelViewer/screens/Settings';
import BlogHandler from './screens/Blog';
import BlogIndexHandler from './screens/Blog/screens/BlogIndex';
import BlogPostHandler from './screens/Blog/screens/BlogPost';
import UnsupportedOnMobileHandler from './screens/UnsupportedOnMobile';
import TruffyHandler from './screens/Truffy';
import ExploreHandler from './screens/Explore';

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
        path: '/tutorial/designer/:step',
        indexRoute: {
          onEnter: (nextState, replace) => replace('/tutorial/designer/make-your-first-model/pencil'),
        },
        childRoutes: [
          {
            path: ':substep',
            onEnter: (nextState, replace, callback) => {
              if (isMobile) {
                replace('/tutorial/unsupported');
                return callback();
              }

              require.ensure([], require => {
                const slugs: typeof DesignTutorialSlugs = require<any>(
                  './screens/Tutorial/screens/DesignTutorial/slugs').default;

                const { step, substep } = nextState.params;

                if (!slugs[step]) {
                  replace('/tutorial/designer');
                } else if (!slugs[step][substep]) {
                  replace(`/tutorial/designer/${step}`);
                }

                return callback();
              });
            },
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<any>('./screens/Tutorial/screens/DesignTutorial').default);
            }),
          },
        ],
      },
      {
        path: '/model/edit',
        onEnter: (nextState, replace) => replace(Object.assign({}, nextState.location, { pathname: '/studio' })),
      },
      {
        path: '/studio',
        onEnter: (nextState, replace) => {
          if (isMobile) replace('/studio/unsupported');
        },
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
            path: '/tutorial',
            onEnter: (nextState, replace) => replace('/tutorial/designer'),
          },
          {
            path: '/tutorial/designer',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<any>('./screens/Tutorial/screens/DesignTutorialIndex').default);
            }),
          },
          {
            path: '/tutorial/unsupported',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: UnsupportedOnMobileHandler }>('./screens/UnsupportedOnMobile').default);
            }),
          },
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
            indexRoute: {
              getComponent: (location, cb) => require.ensure([], require => {
                cb(null, require<{ default: ModelViewerIndexHandler }>('./screens/ModelViewer/screens/Index').default);
              }),
            },
            childRoutes: [
              {
                path: 'likes',
                getComponent: (location, cb) => require.ensure([], require => {
                  cb(null, require<{ default: ModelViewerLikesHandler }>('./screens/ModelViewer/screens/Likes').default);
                }),
              },
              {
                onEnter: (nextState, replace, callback) => {
                  // TODO: Use redux store for cache
                  const { modelId } = nextState.params;

                  axios.get(`${CONFIG_API_SERVER_URL}/files/${modelId}/check-ownership`, { withCredentials: true })
                    .then(response => callback())
                    .catch(response => {
                      replace(`/model/${modelId}`)
                      callback();
                    });
                },
                path: 'settings',
                getComponent: (location, cb) => require.ensure([], require => {
                  cb(null, require<{ default: ModelVeiwerSettingsHandler }>('./screens/ModelViewer/screens/Settings').default);
                }),
              },
            ],
          },
          {
            path: '/blog',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: BlogHandler }>('./screens/Blog').default);
            }),
            indexRoute: {
              getComponent: (location, cb) => require.ensure([], require => {
                cb(null, require<{ default: BlogIndexHandler }>('./screens/Blog/screens/BlogIndex').default);
              }),
            },
            childRoutes: [
              {
                path: ':slug',
                getComponent: (location, cb) => require.ensure([], require => {
                  cb(null, require<{ default: BlogPostHandler }>('./screens/Blog/screens/BlogPost').default);
                }),
              },
            ],
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
            onEnter: (nextState, replace) => replace('/studio/unsupported'),
          },
          {
            path: '/studio/unsupported',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: UnsupportedOnMobileHandler }>('./screens/UnsupportedOnMobile').default);
            }),
          },
          {
            path: '/truffy',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: TruffyHandler }>('./screens/Truffy').default);
            }),
          },
          {
            path: '/explore',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: ExploreHandler }>('./screens/Explore').default);
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
