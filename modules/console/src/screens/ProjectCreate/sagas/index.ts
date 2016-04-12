import { call, fork, put, take, race, select, cancel } from 'redux-saga/effects';
import { isCancelError } from 'redux-saga';
import { replace } from 'react-router-redux';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { request } from '../../../saga';

export function* save(data) {
  const response = yield call(request.post, `${CONFIG_API_SERVER_URL}/projects`, {
    userid: '', // Anonymous
    data,
  });

  const { id: projectId } = response.data;
  yield put(replace({ pathname: `/@/${projectId}/latest/edit` }));
};
