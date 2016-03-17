import { Course } from '../reducers/course';

import { Action } from './';

export const REQUEST_RECOMMENDED_COURSES: 'users/REQUEST_RECOMMENDED_COURSES' = 'users/REQUEST_RECOMMENDED_COURSES';
export interface RequestLatestCoursesAction extends Action<typeof REQUEST_RECOMMENDED_COURSES> {
}
export function requestRecommendedCourses(): RequestLatestCoursesAction {
  return {
    type: REQUEST_RECOMMENDED_COURSES,
  };
}

export const FETCH_COURSE: 'course/FETCH_COURSE' = 'course/FETCH_COURSE';
export interface FetchCourseAction extends Action<typeof FETCH_COURSE> {
  courseId: string;
}
export function fetchCourse(courseId: string): FetchCourseAction {
  return {
    type: FETCH_COURSE,
    courseId,
  };
}

export const COURSE_FETCHED: 'course/COURSE_FETCHED' = 'course/COURSE_FETCHED';
export interface CourseFetchedAction extends Action<typeof COURSE_FETCHED> {
  course: Course;
}

export const COURSES_FETCHED: 'users/COURSES_FETCHED' = 'users/COURSES_FETCHED';
export interface CoursesFetchedAction extends Action<typeof COURSES_FETCHED> {
  courses: Course[];
}

export const RECOMMENDED_COURSES_FETCHED: 'users/RECOMMENDED_COURSES_FETCHED' = 'users/RECOMMENDED_COURSES_FETCHED';
export interface RecommendedCoursesFetchedAction extends Action<typeof RECOMMENDED_COURSES_FETCHED> {
  courses: Course[];
}

export const COURSE_UNLOAD: 'users/COURSE_UNLOAD' = 'users/COURSE_UNLOAD';
export interface CourseUnloadAction extends Action<typeof COURSE_UNLOAD> {
  courseId: string;
}
