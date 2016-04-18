import { call, fork, put, take, race, select, cancel } from 'redux-saga/effects';
import { isCancelError } from 'redux-saga';
import { replace } from 'react-router-redux';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { request } from '../../../saga';

export function* createAnonProject(data: any) {
  const response = yield call(request.post, `${CONFIG_API_SERVER_URL}/projects/anonymous`, {
    data,
  });

  const { id: projectId } = response.data;
  yield put(replace({ pathname: `/@/${projectId}/latest/edit` }));
};

export function* createUserProject(data: any) {
  const response = yield call(request.post, `${CONFIG_API_SERVER_URL}/projects/user`, {
    data,
  });

  const { username, id: projectId } = response.data;
  yield put(replace({ pathname: `/@${username}/${projectId}/latest/edit` }));
};

export function* updateAnonProject(projectId: string, data: any) {
  const response = yield call(request.put, `${CONFIG_API_SERVER_URL}/projects/anonymous/${projectId}`, {
    data,
  });
  console.log(response);
}

export function* updateUserProject(username: string, projectId: string, data: any) {
  const response = yield call(request.put, `${CONFIG_API_SERVER_URL}/projects/user/${projectId}`, {
    data,
  });
  console.log(response);
}
