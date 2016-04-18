import { Store } from 'redux';
import Root from './screens/Root';
import Anonymous from './screens/Anonymous';
import AnonymousIndex from './screens/Anonymous/screens/Index';
import About from './screens/About';
import Contact from './screens/Contact';
import GetStarted from './screens/GetStarted';
import FeaturesForTeachers from './screens/FeaturesForTeachers';
import LoggedIn from './screens/LoggedIn';
import LoggedInIndex from './screens/LoggedIn/screens/Index';
import Features from './screens/Features';
import NotFound from './screens/NotFound';
import Course from './screens/Course';
import CourseIndex from './screens/Course/screens/Index';
import Unit from './screens/Course/screens/Unit';
import Join from './screens/Join';
import Login from './screens/Login';
import OnlineStudio from './screens/OnlineStudio';
import OnlineCardboard from './screens/OnlineCardboard';
import ProjectStudio from './screens/ProjectStudio';
import ProjectCardboard from './screens/ProjectCardboard';
import ProfileHandler from './screens/Profile';
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
      {
        path: '/create',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: ProjectStudio }>('./screens/ProjectStudio').default);
        }),
      },
      {
        path: '/@/:projectId/:revision/edit',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: ProjectStudio }>('./screens/ProjectStudio').default);
        }),
      },
      {
        path: '/@:username/:projectId/:revision/edit',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: ProjectStudio }>('./screens/ProjectStudio').default);
        }),
      },
      {
        path: '/@/:projectId/:revision/vr',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: ProjectCardboard }>('./screens/ProjectCardboard').default);
        }),
      },
      {
        path: '/@:username/:projectId/:revision/vr',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: ProjectCardboard }>('./screens/ProjectCardboard').default);
        }),
      },
      {
        path: '/connect',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: OnlineStudio }>('./screens/OnlineStudio').default);
        }),
      },
      {
        path: '/connect/vr',
        getComponent: (location, cb) => require.ensure([], require => {
          cb(null, require<{ default: OnlineCardboard }>('./screens/OnlineCardboard').default);
        }),
      },
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
            path: '/@:username',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: ProfileHandler }>('./screens/Profile').default);
            }),
          },
          {
            path: '/about',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: About }>('./screens/About').default);
            }),
          },
          {
            path: '/contact',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: Contact }>('./screens/Contact').default);
            }),
          },
          {
            path: '/get-started',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: GetStarted }>('./screens/GetStarted').default);
            }),
          },
          {
            path: '/features',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: Features }>('./screens/Features').default);
            }),
          },
          {
            path: '/features/teachers',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: FeaturesForTeachers }>('./screens/FeaturesForTeachers').default);
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
          {
            path: '*',
            getComponent: (location, cb) => require.ensure([], require => {
              cb(null, require<{ default: NotFound }>('./screens/NotFound').default);
            }),
          },
        ],
      },
    ]
  };
};
