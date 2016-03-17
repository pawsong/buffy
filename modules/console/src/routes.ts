import { Store } from 'redux';
import Landing from './screens/Landing';
import Root from './screens/Root';
import App from './screens/App';
import Dashboard from './screens/App/screens/Dashboard';
import Course from './screens/App/screens/Course';
import CourseIndex from './screens/App/screens/Course/screens/Index';
import Unit from './screens/App/screens/Course/screens/Unit';
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
              cb(null, require<{ default: Landing }>('./screens/Landing').default);
            });
          }

          return require.ensure([], (require) => {
            cb(null, require<{ default: App }>('./screens/App').default);
          });
        },
        indexRoute: {
          getComponent: (location, cb) => {
            if (!isLoggedIn()) { return cb(); }

            return require.ensure([], (require) => {
              cb(null, require<{ default: Dashboard }>('./screens/App/screens/Dashboard').default);
            });
          }
        },
        childRoutes: [
          {
            path: '/courses/:courseId',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: Course }>('./screens/App/screens/Course').default);
            }),
            indexRoute: {
              getComponent: (location, cb) => require.ensure([], (require) => {
                cb(null, require<{ default: CourseIndex }>('./screens/App/screens/Course/screens/Index').default);
              }),
            },
            childRoutes: [
              {
                path: 'units/:unitIndex',
                getComponent: (location, cb) => require.ensure([], require => {
                  cb(null, require<{ default: Unit }>('./screens/App/screens/Course/screens/Unit').default);
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
