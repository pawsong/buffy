import { takeLatest } from 'redux-saga';
import { take, put, call, fork, cancel, select } from 'redux-saga/effects';

import * as Promise from 'bluebird';

import {
  REQUEST_RECOMMENDED_COURSES,
  RECOMMENDED_COURSES_FETCHED, RecommendedCoursesFetchedAction,
} from '../../../actions/course';

function sleep(sec: number) {
  return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

export function* loadRecommendedCourses() {
  yield call(sleep, 1);
  yield put<RecommendedCoursesFetchedAction>({ type: RECOMMENDED_COURSES_FETCHED, courses: courses });
}

export default function* () {
  yield* takeLatest(REQUEST_RECOMMENDED_COURSES, loadRecommendedCourses);
}

export function* fetchRecommendedCourses() {
  yield* takeLatest(REQUEST_RECOMMENDED_COURSES, loadRecommendedCourses);
}

const thumbnail = require('file!./course_thumb.png');

const courses = [
  {
    id: '1',
    title: 'Make a line tracer 1',
    description: 'Making line tracer is one of the basic robot cources for entry level students',
    thumbnail: thumbnail,
  },
  {
    id: '2',
    title: 'Make a line tracer 2',
    description: 'This is a long course description. This is so long that the screen cannot show the whole text. ' +
                 'This is a long course description. This is so long that the screen cannot show the whole text. ' +
                 'This is a long course description. This is so long that the screen cannot show the whole text. ',
    thumbnail: thumbnail,
  },
  {
    id: '3',
    title: 'Make a line tracer 3',
    description: 'Last one!',
    thumbnail: thumbnail,
  },
];
