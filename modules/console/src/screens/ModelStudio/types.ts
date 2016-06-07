import * as Immutable from 'immutable';

import ModelEditor, {
  ModelCommonState,
  ModelFileState,
  ModelExtraData,
} from '../../components/ModelEditor';

import { SourceFile } from '../../types';

export interface ModelFile extends SourceFile<ModelFileState, ModelExtraData> {}

export type ModelFileMap = Immutable.Map<string, ModelFile>;
