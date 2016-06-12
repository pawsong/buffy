import { call, fork, put, take, race, select, cancel } from 'redux-saga/effects';
import { replace } from 'react-router-redux';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { request } from '../../../saga';

interface CreateFileParams {
  name: string;
  format: string;
  data: any;
}

export function* issueFileIds(count: number, callback: (fileIds: string[]) => any) {
  const response = yield call(request.post, `${CONFIG_API_SERVER_URL}/files/issue-ids`, { count });
  if (response.status !== 200) {
    // TODO: Error handling
    return;
  }
  callback(response.data);
}

export function* createFile(params: CreateFileParams, callback: (fileId: string) => any) {
  let response;
  response = yield call(request.post, `${CONFIG_API_SERVER_URL}/files`, {
    name: params.name,
    format: params.format,
  });
  if (response.status !== 200) {
    // TODO: Error handling
    return;
  }

  const { id: fileId } = response.data;
  response = yield call(request.post, `${CONFIG_API_SERVER_URL}/files/${fileId}/issue-update-url`);
  if (response.status !== 200) {
    // TODO: Error handling
    return;
  }

  const { contentType, signedUrl } = response.data;
  response = yield call(request.put, signedUrl, params.data, {
    headers: { 'Content-Type': contentType },
    withCredentials: false,
  });
  console.log(response);
  callback(fileId);
}

export function* createFiles(paramsList: CreateFileParams[]) {
  yield paramsList.map(params => call(createFile, params));
}

export function* loadProject(url: string, callback: any) {
  const response = yield call(request.get, url);
  if (response.status !== 200) {
    // TODO: Error handling
    return;
  }
  const { data } = response;
  callback(data);
}

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
