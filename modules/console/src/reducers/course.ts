import { combineReducers } from 'redux'
import * as Immutable from 'immutable';
import update from '../utils/update';
import objectAssign = require('object-assign');

import { Action } from '../actions';
// import {
//   USER_ADD, UserAddAction,
//   USER_REMOVE, UserRemoveAction,
// } from '../actions/users';
import {
  REQUEST_RECOMMENDED_COURSES,
  FETCH_COURSE,
  COURSE_FETCHED, CourseFetchedAction,
  RECOMMENDED_COURSES_FETCHED, RecommendedCoursesFetchedAction,
} from '../actions/course';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

export type Courses = Immutable.Map<string, Course>;

export interface CourseState {
  courses: Courses;
  recommendedCourses: string[];
  fetchingRecommendedCourses: boolean;
}

export function initialize(state = <CourseState>{}): CourseState {
  return objectAssign({}, state, <CourseState>({
    courses: Immutable.Map<string, Course>(state.courses),
  }));
}

const initialState: CourseState = {
  courses: Immutable.Map<string, Course>(),
  recommendedCourses: [],
  fetchingRecommendedCourses: false,
};

export default function course(state: CourseState = initialState, action: Action<string>): CourseState {
  switch (action.type) {
    case REQUEST_RECOMMENDED_COURSES: {
      return update(state, {
        fetchingRecommendedCourses: true,
      });
    }
    // case FETCH_COURSE: {
    //   return update(state, {
    //     fetchingRecommendedCourses: true,
    //   });
    // }
    case COURSE_FETCHED: {
      const { course } = <CourseFetchedAction>(action);
      return update(state, {
        courses: state.courses.set(course.id, course),
      });
    }
    case RECOMMENDED_COURSES_FETCHED: {
      const { courses } = <RecommendedCoursesFetchedAction>(action);
      return update(state, {
        fetchingRecommendedCourses: false,
        recommendedCourses: courses.map(course => course.id),
        courses: state.courses.withMutations(mutable => {
          courses.forEach(course => mutable.set(course.id, course));
        }),
      });
    }
    // case LOAD_COURSE: {
    // }
    // case USER_ADD: {
    //   const { user } = <UserAddAction>action;
    //   return state.set(user.id, {
    //     id: user.id,
    //     picture: user.picture,
    //   });
    // }
    // case USER_REMOVE: {
    //   const { userid } = <UserRemoveAction>action;
    //   return state.remove(userid);
    // }

    default: {
      return state;
    }
  }
}
