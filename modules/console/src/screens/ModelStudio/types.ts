import * as Immutable from 'immutable';

import ModelEditor, {
  ModelCommonState,
  ModelFileState,
  ModelExtraData,
} from '../../components/ModelEditor';

import {
  AnimationExtraData,
} from '../../components/AnimationEditor';

import {
  SourceFile,
  User,
  ForkItem,
  ModelFileDocument,
} from '../../types';

export interface ModelFile extends SourceFile<ModelFileState, ModelExtraData> {
  owner: User;
  thumbnail: string;
  forkParent: ForkItem;
  animation: AnimationExtraData;
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

export enum EditorMode {
  DRAW,
  ANIMATE,
}

export { ForkItem, ModelFileDocument }
