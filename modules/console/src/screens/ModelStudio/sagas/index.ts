import { call, fork, put, take, race, select, cancel } from 'redux-saga/effects';
import { replace } from 'react-router-redux';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import ModelEditor, { ModelFileState } from '../../../components/ModelEditor';
import { ModelFile, ModelFileDocument } from '../types';
import { request, wait } from '../../../saga';
import ThumbnailFactory from '../../../canvas/ThumbnailFactory';
import {
  MaterialMapType,
} from '../../../types';

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
      signedUrl, contentType, cacheControl,
      thumbnailId,
      thumbnailSignedUrl, thumbnailContentType, thumbnailCacheControl,
    } = response.data;

    const data = ModelEditor.serialize(params.body).buffer;

    response = yield call(request.put, signedUrl, data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
      withCredentials: false,
    });

    const thumbnailBlob = yield call(thumbnailFactory.createThumbnailBlob, params.body.present.data);

    response = yield call(request.put, thumbnailSignedUrl, thumbnailBlob, {
      headers: {
        'Content-Type': thumbnailContentType,
        'Cache-Control': thumbnailCacheControl,
      },
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
  forkParent: string;
}

export function* createFile(thumbnailFactory: ThumbnailFactory, params: CreateFileParams, callback: () => any) {
  let response;
  response = yield call(request.post, `${CONFIG_API_SERVER_URL}/files`, {
    id: params.id,
    name: params.name,
    format: 'bfm',
    isPublic: params.isPublic,
    forkParent: params.forkParent || undefined,
  });
  if (response.status !== 200) {
    // TODO: Error handling
    return;
  }

  yield call(updateFiles, thumbnailFactory, [params]);
  callback();
}

interface LoadLatestPublicFilesParams {
  before?: string;
}
export function* loadLatestPublicFiles(params: LoadLatestPublicFilesParams, callback: (result: any) => any) {
  let response;
  response = yield call(request.get, `${CONFIG_API_SERVER_URL}/files?before=${params.before || ''}`);
  if (response.status !== 200) {
    // TODO: Error handling
    return;
  }
  callback(response.data);
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

export function* _openRemoteFile(fileId: string) {
  const [docRes, dataRes] = yield [
    call(request.get, `${CONFIG_API_SERVER_URL}/files/${fileId}`),
    call(request.get, `${__S3_BASE__}/files/${fileId}`, {
      responseType: 'arraybuffer',
      withCredentials: false,
    }),
  ];
  if (docRes.status !== 200) {
    // TODO: Error handling
    return null;
  }
  if (dataRes.status !== 200) {
    // TODO: Error handling
    return null;
  }

  const doc = docRes.data;
  const fileState = ModelEditor.deserialize(new Uint8Array(dataRes.data));

  return { doc, fileState };
}

export function* openRemoteFile(fileId: string, callback: (doc: ModelFileDocument, fileState: ModelFileState) => any) {
  const result = yield call(_openRemoteFile, fileId);
  callback(result.doc, result.fileState);
}

export function* deleteFile(fileId: string, callback: () => any) {
  const response = yield call(request.del, `${CONFIG_API_SERVER_URL}/files/${fileId}`);
  if (response.status !== 200) {
    // TODO: Error handling
    return;
  }
  callback();
}

export function* openRemoteFiles(files: string[], callback: (results: {
  doc: ModelFileDocument;
  fileState: ModelFileState;
}[]) => any) {
  const results: any[] = yield files.map(fileId => call(_openRemoteFile, fileId));
  callback(results.filter(result => result));
}
