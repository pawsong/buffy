import { call, put } from 'redux-saga/effects';
import {
  COURSE_FETCHED, CourseFetchedAction,
} from '../../../../../actions/course';

function sleep(sec: number) {
  return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

export const loadCourse = id => function* loadCourse() {
  yield call(sleep, 0);
  const course = courses[id];
  yield put<CourseFetchedAction>({ type: COURSE_FETCHED, course });
}

const thumbnail = require('file!./course_thumb.png');

const courses = {
  '1': {
    id: '1',
    title: 'Make a line tracer 1',
    description: 'Making line tracer is one of the basic robot cources for entry level students',
    thumbnail: thumbnail,
  },
  '2': {
    id: '2',
    title: 'Make a line tracer 2',
    description: 'This is a long course description. This is so long that the screen cannot show the whole text. ' +
                 'This is a long course description. This is so long that the screen cannot show the whole text. ' +
                 'This is a long course description. This is so long that the screen cannot show the whole text. ',
    thumbnail: thumbnail,
  },
  '3': {
    id: '3',
    title: 'Make a line tracer 3',
    description: 'Last one!',
    thumbnail: thumbnail,
  }
};
