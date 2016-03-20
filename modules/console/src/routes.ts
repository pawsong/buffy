import { Store } from 'redux';
import Root from './screens/Root';
import Anonymous from './screens/Anonymous';
import AnonymousIndex from './screens/Anonymous/Index';
import LoggedIn from './screens/LoggedIn';
import LoggedInIndex from './screens/LoggedIn/screens/Index';
import Features from './screens/Features';
import Course from './screens/Course';
import CourseIndex from './screens/Course/screens/Index';
import Unit from './screens/Course/screens/Unit';
import Join from './screens/Join';
import Login from './screens/Login';
import StudioForCourse from './screens/StudioForCourse';
import { State } from './reducers';

export default function getRoutes(store: Store) {

  function isLoggedIn() {
    const state: State = store.getState();
    return !!state.auth.userid;
  }

  function redirectToDashboard(nextState, replace) {
    if (isLoggedIn()) { replace('/'); }
  }

  return {
    component: Root,
    childRoutes: [
      {
        path: '/',
        getComponent: (location, cb) => {
          if (!isLoggedIn()) {
            return require.ensure([], require => {
              cb(null, require<{ default: Anonymous }>('./screens/Anonymous').default);
            });
          } else {
            return require.ensure([], require => {
              cb(null, require<{ default: LoggedIn }>('./screens/LoggedIn').default);
            });
          }
        },
        indexRoute: {
          getComponent: (location, cb) => {
            if (!isLoggedIn()) {
              return require.ensure([], (require) => {
                cb(null, require<{ default: AnonymousIndex }>('./screens/Anonymous/screens/Index').default);
              });
            } else {
              return require.ensure([], (require) => {
                cb(null, require<{ default: LoggedInIndex }>('./screens/LoggedIn/screens/Index').default);
              });
            }
          }
        },
        childRoutes: [
          {
            path: '/features',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: Features }>('./screens/Features').default);
            }),
          },
          {
            path: '/courses/:courseId',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: Course }>('./screens/Course').default);
            }),
            indexRoute: {
              getComponent: (location, cb) => require.ensure([], (require) => {
                cb(null, require<{ default: CourseIndex }>('./screens/Course/screens/Index').default);
              }),
            },
            childRoutes: [
              {
                path: 'units/:unitIndex',
                getComponent: (location, cb) => require.ensure([], require => {
                  cb(null, require<{ default: Unit }>('./screens/Course/screens/Unit').default);
                }),
              }
            ],
          },
        ],
      },
      {
        path: '/courses/:courseId/units/:unitIndex/play',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: StudioForCourse }>('./screens/StudioForCourse').default);
        }),
      },
      {
        onEnter: redirectToDashboard,
        childRoutes: [
          // Unauthenticated routes
          // Redirect to dashboard if user is already logged in
          {
            path: '/join',
            getComponent: (location, cb) => {
              return require.ensure([], require => {
                cb(null, require<{ default: Join }>('./screens/Join').default);
              });
            },
          },
          {
            path: '/login',
            getComponent: (location, cb) => {
              return require.ensure([], require => {
                cb(null, require<{ default: Join }>('./screens/Login').default);
              });
            },
          },
        ],
      },
    ]
  };
};
