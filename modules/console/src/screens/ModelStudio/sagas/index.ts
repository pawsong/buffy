import { call, fork, put, take, race, select, cancel } from 'redux-saga/effects';
import { isCancelError } from 'redux-saga';
import { replace } from 'react-router-redux';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import ModelEditor, { ModelFileState } from '../../../components/ModelEditor';
import { ModelFile } from '../types';
import { request, wait } from '../../../saga';
import ThumbnailFactory from '../../../canvas/ThumbnailFactory';

interface UpdateFileParams {
  id: string;
  body: ModelFileState;
}

export function* updateFiles(thumbnailFactory: ThumbnailFactory, paramsList: UpdateFileParams[], callback?: () => any) {
  for (let i = 0, len = paramsList.length; i < len; ++i) {
    const params = paramsList[i];

    let response;
    response = yield call(request.post, `${CONFIG_API_SERVER_URL}/files/${params.id}/issue-update-url`);
    if (response.status !== 200) {
      // TODO: Error handling
      return;
    }

    const {
      signedUrl, contentType,
      thumbnailId,
      thumbnailSignedUrl, thumbnailContentType,
    } = response.data;

    const data = ModelEditor.serialize(params.body).buffer;

    response = yield call(request.put, signedUrl, data, {
      headers: { 'Content-Type': contentType },
      withCredentials: false,
    });

    const thumbnailBlob = yield call(thumbnailFactory.createThumbnailBlob, params.body.present.data.model);

    response = yield call(request.put, thumbnailSignedUrl, thumbnailBlob, {
      headers: { 'Content-Type': thumbnailContentType },
      withCredentials: false,
    });

    response = yield call(request.post, `${CONFIG_API_SERVER_URL}/files/${params.id}/report-update`, { thumbnailId });
    if (response.status !== 200) {
      // TODO: Error handling
      return;
    }
  }

  if (callback) callback();
}

interface CreateFileParams extends UpdateFileParams {
  name: string;
  isPublic: boolean;
}

export function* createFile(thumbnailFactory: ThumbnailFactory, params: CreateFileParams, callback: () => any) {
  let response;
  response = yield call(request.post, `${CONFIG_API_SERVER_URL}/files`, {
    id: params.id,
    name: params.name,
    format: 'bfm',
    isPublic: params.isPublic,
  });
  if (response.status !== 200) {
    // TODO: Error handling
    return;
  }

  yield call(updateFiles, thumbnailFactory, [params]);
  callback();
}

interface LoadRemoteFilesParams {
  before?: string;
}

export function* loadRemoteFiles(username: string, params: LoadRemoteFilesParams, callback: (result: any) => any) {
  let response;
  response = yield call(request.get, `${CONFIG_API_SERVER_URL}/files/@${username}?before=${params.before || ''}`);
  if (response.status !== 200) {
    // TODO: Error handling
    return;
  }
  callback(response.data);
}

interface UpdateFileMetaParams {
  name?: string;
}

export function* updateFileMeta(fileId: string, params: UpdateFileMetaParams, callback: () => any) {
  let response;
  response = yield call(request.put, `${CONFIG_API_SERVER_URL}/files/${fileId}`, params);
  if (response.status !== 200) {
    // TODO: Error handling
    return;
  }
  callback();
}

export function* openRemoteFile(fileId: string, callback: (fileState: ModelFileState) => any) {
  let response;
  response = yield call(request.get, `${__RESOURCE_BASE__}/files/${fileId}`, {
    responseType: 'arraybuffer',
    withCredentials: false,
  });

  if (response.status !== 200) {
    // TODO: Error handling
    return;
  }

  const fileState = ModelEditor.deserialize(new Uint8Array(response.data));
  callback(fileState);
}
