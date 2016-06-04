import * as ndarray from 'ndarray';
const cwise = require('cwise');
import { createSelector } from 'reselect';

import undoable from '@pasta/helper/lib/undoable';

import ndFloodFill from '../ndops/floodFill';
import ndAny from '../ndops/any';
import ndAssign from '../ndops/assign';
import ndAssign2 from '../ndops/assign2';
import ndAssignAndMask2 from '../ndops/assignAndMask2';
import ndExclude from '../ndops/exclude';
import ndCopyWithFilter from '../ndops/copyWithFilter';
import ndSet from '../ndops/set';
import ndSetWithFilter2 from '../ndops/setWithFilter2';
import ndFill from '../ndops/fill';
import ndFillWithFilter2 from '../ndops/fillWithFilter2';

import {
  Position,
  Action,
  Voxel,
  Volumn,
  VoxelData,
  Transformation,
  Clipboard,
} from '../types';

import {
  VOXEL_ADD, VoxelAddAction,
  VOXEL_ADD_BATCH, VoxelAddBatchAction,
  VOXEL_REMOVE, VoxelRemoveAction,
  VOXEL_REMOVE_BATCH, VoxelRemoveBatchAction,
  VOXEL_SELECT_PROJECTION, VoxelSelectProjectionAction,
  VOXEL_SELECT_BOX, VoxelSelectBoxAction,
  VOXEL_SELECT_CONNECTED, VoxelSelectConnectedAction,
  VOXEL_MAGIN_WAND, VoxelMaginWandAction,
  VOXEL_CREATE_FRAGMENT, VoxelCreateFragmentAction,
  VOXEL_MOVE_FRAGMENT, VoxelMoveFragmentAction,
  VOXEL_MERGE_FRAGMENT, VoxelMergeFragmentAction,
  VOXEL_REMOVE_SELECTED, VoxelRemoveSelectedAction,
  VOXEL_CLEAR_SELECTION, VoxelClearSelection,
  VOXEL_RESIZE, VoxelResizeAction,
  VOXEL_TRANSFORM, VoxelTransformAction,
  VOXEL_COLOR_FILL, VoxelColorFillAction,
  VOXEL_ADD_LIST, VoxelAddListAction,
  VOXEL_PASTE, VoxelPasteAction,
} from '../actions';

const initialSize: Position = [16, 16, 16];

const initialMatrix = ndarray(new Int32Array(initialSize[0] * initialSize[1] * initialSize[2]), initialSize);
initialMatrix.set(0,1,1, 1 << 24 | 0xff << 8);
initialMatrix.set(1,1,1, 1 << 24 | 0xff << 8);

const initialState: VoxelData = {
  size: initialSize,
  matrix: initialMatrix,
  selection: null,
  fragment: null,
  fragmentOffset: [0, 0, 0],
};

function rgbToHex({ r, g, b }) {
  return (1 << 24) /* Used by mesher */ | (r << 16) | (g << 8) | b;
}

// Make different from rgb value
const SELECTION_VALUE = 2 << 24;

const filterProjection = (() => {
  const _filterProjection = cwise({
    args: [
      'index', 'array', 'array', 'scalar', 'scalar',
      'scalar', 'scalar', 'scalar', 'scalar', 'scalar', 'scalar',
      'scalar', 'scalar', 'scalar', 'scalar', 'scalar', 'scalar',
      'scalar', 'scalar', 'scalar', 'scalar',
    ],
    pre: function () {
      this.selected = false;
    },
    body: function (
      i, dest, src, value, scale,
      e0, e1, e3, e4,  e5, e7,
      e8, e9, e11, e12, e13, e15,
      lo0, lo1, hi0, hi1
    ) {
      if (src) {
        // Apply projection
        var x = (i[0] + 0.5) * scale;
        var y = (i[1] + 0.5) * scale;
        var z = (i[2] + 0.5) * scale;

        var d = 1 / ( e3 * x + e7 * y + e11 * z + e15 ); // perspective divide
        var u = ( e0 * x + e4 * y + e8  * z + e12 ) * d;
        var v = ( e1 * x + e5 * y + e9  * z + e13 ) * d;

        if (u >= lo0 && u < hi0 && v >= lo1 && v < hi1) {
          dest = value;
          this.selected = true;
        }
      }
    },
    post: function () {
      return this.selected;
    },
  });

  return function (
    selection: ndarray.Ndarray,
    model: ndarray.Ndarray,
    maskValue: number, scale: number,
    projectionMatrix: THREE.Matrix4,
    lo0: number, lo1: number, hi0: number, hi1: number
  ) {
		const e = projectionMatrix.elements;
    return _filterProjection(
      selection, model, maskValue, scale,
      e[0], e[1], e[3], e[4], e[5], e[7],
      e[8], e[9], e[11], e[12], e[13], e[15],
      lo0, lo1, hi0, hi1
    );
  };
})();

function hasIntersection(destShape: Position, srcShape: Position, offset: Position) {
  const loX = offset[0];
  const loY = offset[1];
  const loZ = offset[2];
  const hiX = offset[0] + srcShape[0] - 1;
  const hiY = offset[1] + srcShape[1] - 1;
  const hiZ = offset[2] + srcShape[2] - 1;

  return (
       loX < destShape[0] && hiX >= 0
    && loY < destShape[1] && hiY >= 0
    && loZ < destShape[2] && hiZ >= 0
  );
}

function calculateIntersection(destShape: Position, srcShape: Position, offset: Position) {
  let srcOffsetX, srcOffsetY, srcOffsetZ;
  let destOffsetX, destOffsetY, destOffsetZ;
  let width, height, depth;

  if (offset[0] > 0) {
    srcOffsetX = 0;
    destOffsetX = offset[0];
    width = Math.min(srcShape[0], destShape[0] - destOffsetX);
  } else {
    srcOffsetX = -offset[0];
    destOffsetX = 0;
    width = Math.min(srcShape[0] - srcOffsetX, destShape[0]);
  }

  if (offset[1] > 0) {
    srcOffsetY = 0;
    destOffsetY = offset[1];
    height = Math.min(srcShape[1], destShape[1] - destOffsetY);
  } else {
    srcOffsetY = -offset[1];
    destOffsetY = 0;
    height = Math.min(srcShape[1] - srcOffsetY, destShape[1]);
  }

  if (offset[2] > 0) {
    srcOffsetZ = 0;
    destOffsetZ = offset[2];
    depth = Math.min(srcShape[2], destShape[2] - destOffsetZ);
  } else {
    srcOffsetZ = -offset[2];
    destOffsetZ = 0;
    depth = Math.min(srcShape[2] - srcOffsetZ, destShape[2]);
  }

  return {
    srcOffset: [srcOffsetX, srcOffsetY, srcOffsetZ],
    destOffset: [destOffsetX, destOffsetY, destOffsetZ],
    shape: [width, height, depth],
  };
}

// TODO: Improve algorithm
const findBounds = cwise({
  args: ['index', 'array'],
  pre: function () {
    this.loX = Infinity;
    this.loY = Infinity;
    this.loZ = Infinity;
    this.hiX = -1;
    this.hiY = -1;
    this.hiZ = -1;
  },
  body: function (i, a) {
    if (a) {
      if (this.loX > i[0]) this.loX = i[0];
      if (this.loY > i[1]) this.loY = i[1];
      if (this.loZ > i[2]) this.loZ = i[2];
      if (this.hiX < i[0]) this.hiX = i[0];
      if (this.hiY < i[1]) this.hiY = i[1];
      if (this.hiZ < i[2]) this.hiZ = i[2];
    }
  },
  post: function () {
    return [this.loX, this.loY, this.loZ, this.hiX, this.hiY, this.hiZ];
  }
});

const clipboardSelector = createSelector(
  (clipboard: Clipboard) => clipboard.model,
  (clipboard: Clipboard) => clipboard.selection,
  (model, selection) => {
    const bounds = findBounds(selection);

    const shape = [
      bounds[3] - bounds[0] + 1,
      bounds[4] - bounds[1] + 1,
      bounds[5] - bounds[2] + 1,
    ];

    const offset =
        bounds[0] * selection.stride[0]
      + bounds[1] * selection.stride[1]
      + bounds[2] * selection.stride[2];

    const fragment = ndarray(new Int32Array(shape[0] * shape[1] * shape[2]), shape);
    const partialModel = ndarray(model.data, shape, model.stride, offset);
    const partialSelection = ndarray(selection.data, shape, selection.stride, offset);

    ndCopyWithFilter(fragment, partialModel, partialSelection);
    return fragment;
  }
);

function reduceModelUpsertAction(
  state: VoxelData,
  updateFn: (model: ndarray.Ndarray) => boolean,
  updateWithSelectionFn: (model: ndarray.Ndarray, selection: ndarray.Ndarray) => boolean
): VoxelData {
  const model = ndarray(state.matrix.data.slice(), state.matrix.shape);

  let hit: boolean;

  if (!state.selection) {
    hit = updateFn(model);
  } else {
    hit = updateWithSelectionFn(model, state.selection);
  }

  if (!hit) return state;

  return Object.assign({}, state, { matrix: model });
}

function reduceModelRemoveAction(
  state: VoxelData,
  removeFn: (model: ndarray.Ndarray) => boolean,
  removeWithSelectionFn: (model: ndarray.Ndarray, selection: ndarray.Ndarray) => boolean
): VoxelData {
  const model = ndarray(state.matrix.data.slice(), state.matrix.shape);

  if (!state.selection) {
    if (removeFn(model)) {
      return Object.assign({}, state, { matrix: model });
    } else {
      return state;
    }
  } else {
    const selection = ndarray(state.selection.data.slice(), state.selection.shape);
    if (removeWithSelectionFn(model, selection)) {
      const selectionIsValid = ndAny(selection);
      return Object.assign({}, state, {
        matrix: model,
        selection: selectionIsValid ? selection : null,
      });
    } else {
      return state;
    }
  }
}

enum MergeType {
  NONE,
  OVERWRITE,
  ASSIGN,
}

function reduceSelectAction(state: VoxelData, merge: MergeType, selectFn: (selection: ndarray.Ndarray) => boolean): VoxelData {
  const model = state.matrix;

  switch(merge) {
    case MergeType.NONE: {
      const selection = ndarray(new Int32Array(model.shape[0] * model.shape[1] * model.shape[2]), model.shape);

      if (selectFn(selection)) {
        return Object.assign({}, state, { selection });
      } else {
        if (state.selection) {
          return Object.assign({}, state, { selection: null });
        } else {
          return state;
        }
      }
    }
    case MergeType.OVERWRITE: {
      const selection = ndarray(state.selection.data.slice(), model.shape);

      if (selectFn(selection)) {
        return Object.assign({}, state, { selection });
      } else {
        return state;
      }
    }
    case MergeType.ASSIGN: {
      const selection = ndarray(new Int32Array(model.shape[0] * model.shape[1] * model.shape[2]), model.shape);

      if (selectFn(selection)) {
        ndAssign(selection, state.selection);
        return Object.assign({}, state, { selection });
      } else {
        return state;
      }
    }
  }
}

function voxelDataReducer(state = initialState, action: Action<any>): VoxelData {
  switch (action.type) {
    /*
     * model update operations
     */

    case VOXEL_ADD_BATCH: {
      const { volumn, color } = <VoxelAddBatchAction>action;
      const c = rgbToHex(color);

      return reduceModelUpsertAction(state,
        model => {
          // Skip hit test on the assumption of valid input.
          ndFill(model, volumn, c);
          return true;
        },
        (model, selection) => ndFillWithFilter2(model, volumn, c, selection)
      );
    }

    case VOXEL_ADD_LIST: {
      const { positions, color } = <VoxelAddListAction>action;
      const c = rgbToHex(color);

      return reduceModelUpsertAction(state,
        model => {
          // Skip hit test on the assumption of valid input.
          for (let i = 0, len = positions.length; i < len; ++i) {
            const pos = positions[i];
            model.set(pos[0], pos[1], pos[2], c);
          }
          return true;
        },
        (model, selection) => {
          let hit = false;
          for (let i = 0, len = positions.length; i < len; ++i) {
            const pos = positions[i];
            if (selection.get(pos[0], pos[1], pos[2])) {
              model.set(pos[0], pos[1], pos[2], c);
              hit = true;
            }
          }
          return hit;
        }
      );
    }

    case VOXEL_COLOR_FILL: {
      const { position, color } = <VoxelColorFillAction>action;
      const c = rgbToHex(color);

      return reduceModelUpsertAction(state,
        model => ndFloodFill(model, c, position),
        (model, selection) => ndFloodFill(
          model, c, position, (x, y, z) => selection.get(x, y, z) && model.get(x, y, z)
        )
      );
    }

    case VOXEL_REMOVE_BATCH: {
      const { positions } = <VoxelRemoveBatchAction>action;

      return reduceModelRemoveAction(state,
        model => {
          // Skip hit test on the assumption of valid input.
          for (let i = 0, len = positions.length; i < len; ++i) {
            const pos = positions[i];
            model.set(pos[0], pos[1], pos[2], 0);
          }
          return true;
        },
        (model, selection) => {
          let hit = false;
          for (let i = 0, len = positions.length; i < len; ++i) {
            const pos = positions[i];
            if (selection.get(pos[0], pos[1], pos[2])) {
              model.set(pos[0], pos[1], pos[2], 0);
              selection.set(pos[0], pos[1], pos[2], 0);
              hit = true;
            }
          }
          return hit;
        }
      );
    }

    case VOXEL_REMOVE_SELECTED: {
      if (!state.selection) return;

      const matrix = ndarray(state.matrix.data.slice(), state.matrix.shape);
      ndExclude(matrix, state.selection);

      return Object.assign({}, state, {
        matrix,
        selection: null,
      });
    }

    /*
     * selection update operations
     */

    case VOXEL_SELECT_PROJECTION: {
      const { projectionMatrix, scale, bounds, merge } = <VoxelSelectProjectionAction>action;

      return reduceSelectAction(state, state.selection && merge ? MergeType.OVERWRITE : MergeType.NONE, selection => {
        return filterProjection(
          selection, state.matrix, SELECTION_VALUE, scale, projectionMatrix,
          bounds[0], bounds[1], bounds[2], bounds[3]
        );
      });
    }

    case VOXEL_SELECT_BOX: {
      const { volumn, merge } = <VoxelSelectBoxAction>action;

      return reduceSelectAction(state, state.selection && merge ? MergeType.OVERWRITE : MergeType.NONE, selection => {
        return ndFillWithFilter2(selection, volumn, SELECTION_VALUE, state.matrix);
      });
    }

    case VOXEL_SELECT_CONNECTED: {
      const { position, merge } = <VoxelSelectConnectedAction>action;

      return reduceSelectAction(state, state.selection && merge ? MergeType.ASSIGN : MergeType.NONE, selection => {
        return ndFloodFill(selection, SELECTION_VALUE, position, (x, y, z) => {
          return selection.get(x, y, z) || (state.matrix.get(x, y, z) && 1);
        });
      });
    }

    case VOXEL_MAGIN_WAND: {
      const { position, merge } = <VoxelMaginWandAction>action;

      return reduceSelectAction(state, state.selection && merge ? MergeType.ASSIGN : MergeType.NONE, selection => {
        return ndFloodFill(selection, SELECTION_VALUE, position, (x, y, z) => {
          return selection.get(x, y, z) || state.matrix.get(x, y, z);
        });
      });
    }

    case VOXEL_CLEAR_SELECTION: {
      if (!state.selection) return state;
      return Object.assign({}, state, { selection: null });
    }

    /*
     * fragment update operations
     */

    case VOXEL_CREATE_FRAGMENT: {
      const { model, fragment, fragmentOffset } = <VoxelCreateFragmentAction>action;

      // Reuse ndarray params for performance reason.
      return Object.assign({}, state, {
        matrix: model,
        selection: null,
        fragment,
        fragmentOffset,
      });
    }

    case VOXEL_PASTE: {
      const { model, selection } = <VoxelPasteAction>action;

      const fragment = clipboardSelector({ model, selection });

      const fragmentOffset = [
        Math.floor((state.matrix.shape[0] - fragment.shape[0]) / 2),
        Math.floor((state.matrix.shape[1] - fragment.shape[1]) / 2),
        Math.floor((state.matrix.shape[2] - fragment.shape[2]) / 2),
      ];

      return Object.assign({}, state, {
        selection: null,
        fragment,
        fragmentOffset,
      });
    }

    case VOXEL_MOVE_FRAGMENT: {
      const { offset } = <VoxelMoveFragmentAction>action;

      return Object.assign({}, state, {
        fragmentOffset: offset,
      });
    }

    case VOXEL_MERGE_FRAGMENT: {
      if (!state.fragment) return state;

      if (!hasIntersection(state.matrix.shape, state.fragment.shape, state.fragmentOffset)) {
        return Object.assign({}, state, {
          selection: null,
          fragment: null,
          fragmentOffset: [0, 0, 0],
        });
      }

      const model = ndarray(state.matrix.data.slice(), state.matrix.shape);
      const selection = ndarray(new Int32Array(model.shape[0] * model.shape[1] * model.shape[2]), model.shape);

      const {
        srcOffset,
        destOffset,
        shape,
      } = calculateIntersection(model.shape, state.fragment.shape, state.fragmentOffset);

      const modelOffset =
        model.stride[0] * destOffset[0] +
        model.stride[1] * destOffset[1] +
        model.stride[2] * destOffset[2];

      const fragmentOffset =
        state.fragment.stride[0] * srcOffset[0] +
        state.fragment.stride[1] * srcOffset[1] +
        state.fragment.stride[2] * srcOffset[2];

      const intersectInModel = ndarray(model.data, shape, model.stride, modelOffset);
      const intersectInSelection = ndarray(selection.data, shape, selection.stride, modelOffset);
      const intersectInFragment = ndarray(state.fragment.data, shape, state.fragment.stride, fragmentOffset);

      if (ndAssignAndMask2(intersectInModel, intersectInSelection, intersectInFragment, SELECTION_VALUE)) {
        return Object.assign({}, state, {
          matrix: model,
          selection,
          fragment: null,
          fragmentOffset: [0, 0, 0],
        });
      } else {
        return Object.assign({}, state, {
          selection: null,
          fragment: null,
          fragmentOffset: [0, 0, 0],
        });
      }
    }

    /*
     * Etc.
     */

    case VOXEL_RESIZE: {
      const { size, offset } = <VoxelResizeAction>action;

      const src = state.matrix;
      const dest = ndarray(new Int32Array(size[0] * size[1] * size[2]), size);

      const {
        srcOffset,
        destOffset,
        shape,
      } = calculateIntersection(dest.shape, src.shape, offset);

      const destOffsetSum =
        dest.stride[0] * destOffset[0] +
        dest.stride[1] * destOffset[1] +
        dest.stride[2] * destOffset[2];

      const srcOffsetSum =
        src.stride[0] * srcOffset[0] +
        src.stride[1] * srcOffset[1] +
        src.stride[2] * srcOffset[2];

      const srcIntersect = ndarray(src.data, shape, src.stride, srcOffsetSum);
      const destIntersect = ndarray(dest.data, shape, dest.stride, destOffsetSum);

      ndAssign(destIntersect, srcIntersect);

      let destSelection = null;
      if (state.selection) {
        const srcSelection = state.selection;
        destSelection = ndarray(new Int32Array(size[0] * size[1] * size[2]), size);

        const srcSelectionIntersect = ndarray(srcSelection.data, shape, srcSelection.stride, srcOffsetSum);
        const destSelectionIntersect = ndarray(destSelection.data, shape, destSelection.stride, destOffsetSum);

        if (!ndAssign2(destSelectionIntersect, srcSelectionIntersect)) destSelection = null;
      }

      return Object.assign({}, state, {
        size,
        matrix: dest,
        selection: destSelection,
      });
    }

    case VOXEL_TRANSFORM: {
      const { transform } = <VoxelTransformAction>action;

      // Infer next shape from transform and current size
      const { shape } = state.matrix;
      const w = Math.abs(shape[0] * transform[0][0] + shape[1] * transform[1][0] + shape[2] * transform[2][0]);
      const h = Math.abs(shape[0] * transform[0][1] + shape[1] * transform[1][1] + shape[2] * transform[2][1]);
      const d = Math.abs(shape[0] * transform[0][2] + shape[1] * transform[1][2] + shape[2] * transform[2][2]);

      const ox0 = (shape[0] / 2) - 0.5;
      const oy0 = (shape[1] / 2) - 0.5;
      const oz0 = (shape[2] / 2) - 0.5;

      const ox1 = (w / 2) - 0.5;
      const oy1 = (h / 2) - 0.5;
      const oz1 = (d / 2) - 0.5;

      const model = ndarray(new Int32Array(w * h * d), [w, h ,d]);

      for (let i = 0; i < shape[0]; ++i) {
        for (let j = 0; j < shape[1]; ++j) {
          for (let k = 0; k < shape[2]; ++k) {
            const c = state.matrix.get(i, j, k);
            if (c) {
              const x0 = i - ox0;
              const y0 = j - oy0;
              const z0 = k - oz0;

              const x1 = x0 * transform[0][0] + y0 * transform[1][0] + z0 * transform[2][0];
              const y1 = x0 * transform[0][1] + y0 * transform[1][1] + z0 * transform[2][1];
              const z1 = x0 * transform[0][2] + y0 * transform[1][2] + z0 * transform[2][2];

              model.set(x1 + ox1, y1 + oy1, z1 + oz1, c);
            }
          }
        }
      }

      let selection = null;

      if (state.selection) {
        selection = ndarray(new Int32Array(w * h * d), [w, h ,d]);

        for (let i = 0; i < shape[0]; ++i) {
          for (let j = 0; j < shape[1]; ++j) {
            for (let k = 0; k < shape[2]; ++k) {
              const c = state.selection.get(i, j, k);
              if (c) {
                const x0 = i - ox0;
                const y0 = j - oy0;
                const z0 = k - oz0;

                const x1 = x0 * transform[0][0] + y0 * transform[1][0] + z0 * transform[2][0];
                const y1 = x0 * transform[0][1] + y0 * transform[1][1] + z0 * transform[2][1];
                const z1 = x0 * transform[0][2] + y0 * transform[1][2] + z0 * transform[2][2];

                selection.set(x1 + ox1, y1 + oy1, z1 + oz1, 1);
              }
            }
          }
        }
      }

      return Object.assign({}, state, {
        size: model.shape,
        matrix: model,
        selection,
      });
    }

    default: {
      return state;
    }
  }
}

export default undoable(voxelDataReducer);
