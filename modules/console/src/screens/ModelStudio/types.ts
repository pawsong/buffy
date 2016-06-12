import * as Immutable from 'immutable';

import ModelEditor, {
  ModelCommonState,
  ModelFileState,
  ModelExtraData,
} from '../../components/ModelEditor';

import { SourceFile } from '../../types';

export interface ModelFile extends SourceFile<ModelFileState, ModelExtraData> {
  owner: {
    id: string;
    username: string;
  };
  thumbnail: string;
}

export type ModelFileMap = Immutable.Map<string, ModelFile>;

export interface ModelFileOpenParams {
  id: string;
  owner: {
    id: string;
    username: string;
  };
  name: string;
  created: boolean;
  readonly: boolean;
  body: ModelFileState;
}

export interface ModelFileDocument {
  id: string;
  name: string;
  owner: {
    id: string;
    username: string;
  };
  thumbnail: string;
  modifiedAt: string;
  isPublic: boolean;
}
