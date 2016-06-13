import * as Immutable from 'immutable';

import ModelEditor, {
  ModelCommonState,
  ModelFileState,
  ModelExtraData,
} from '../../components/ModelEditor';

import { SourceFile } from '../../types';

interface User {
  id: string;
  username: string;
}

export interface ForkItem {
  id: string;
  name: string;
  owner: User;
}

export interface ModelFile extends SourceFile<ModelFileState, ModelExtraData> {
  owner: User;
  thumbnail: string;
  forkParent: ForkItem;
}

export type ModelFileMap = Immutable.Map<string, ModelFile>;

export interface ModelFileOpenParams {
  id: string;
  owner: User;
  name: string;
  created: boolean;
  readonly: boolean;
  body: ModelFileState;
  forkParent: ForkItem;
}

export interface ModelFileDocument {
  id: string;
  name: string;
  owner: User;
  thumbnail: string;
  modifiedAt: string;
  isPublic: boolean;
  forkParent: ForkItem;
}
