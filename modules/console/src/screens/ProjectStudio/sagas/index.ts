import { call, fork, put, take, race, select, cancel } from 'redux-saga/effects';
import { isCancelError } from 'redux-saga';
import { replace } from 'react-router-redux';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { request } from '../../../saga';

/**
 * createAnonProject
 */
export function* createAnonProject(data: any) {
  const response = yield call(request.post, `${CONFIG_API_SERVER_URL}/projects/anonymous`, {
    data,
  });

  const { id: projectId } = response.data;
  yield put(replace({ pathname: `/@/${projectId}/latest/edit` }));
};

/**
 * createUserProject
 */
export function* createUserProject(userId: string, data: any) {
  const response = yield call(request.post, `${CONFIG_API_SERVER_URL}/projects/@${userId}`, {
    data,
  });

  const { id: projectId } = response.data;
  yield put(replace({ pathname: `/@${userId}/${projectId}/latest/edit` }));
};

export function* updateAnonProject(projectId: string, data: any) {
  const response = yield call(request.put, `${CONFIG_API_SERVER_URL}/projects/anonymous/${projectId}`, {
    data,
  });
  console.log(response);
}

export function* updateUserProject(userId: string, projectId: string, data: any) {
  const response = yield call(request.put, `${CONFIG_API_SERVER_URL}/projects/@${userId}/${projectId}`, {
    data,
  });
  console.log(response);
}
