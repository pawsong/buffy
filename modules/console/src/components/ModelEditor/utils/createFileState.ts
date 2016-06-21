import { reset, undo, redo } from '@pasta/helper/lib/undoable';
import fileReducer from '../reducers/file';

import {
  FileState,
  VoxelData,
} from '../types';

function createFileState(data?: VoxelData): FileState {
  return data ? fileReducer(undefined, reset(data)) : fileReducer(undefined, { type: '' });
}

export default createFileState;
