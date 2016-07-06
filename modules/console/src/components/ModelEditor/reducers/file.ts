import * as ndarray from 'ndarray';
const cwise = require('cwise');
import { createSelector } from 'reselect';

const invariant = require('fbjs/lib/invariant');

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
import ndFill2 from '../ndops/fill2';
import ndFillWithFilter2 from '../ndops/fillWithFilter2';

import getSlice from '../utils/getSlice';
import calculateIntersection from '../utils/calculateIntersection';

import {
  Position,
  Action,
  Voxel,
  Volumn,
  VoxelData,
  Transformation,
  Axis,
} from '../types';

import {
  VOXEL_ADD, VoxelAddAction,
  VOXEL_ADD_BATCH_3D, VoxelAddBatch3dAction,
  VOXEL_ADD_BATCH_2D, VoxelAddBatch2dAction,
  VOXEL_REMOVE_LIST_2D, VoxelRemoveList2dAction,
  VOXEL_REMOVE_LIST_3D, VoxelRemoveList3dAction,
  VOXEL_SELECT_PROJECTION, VoxelSelectProjectionAction,
  VOXEL_SELECT_BOX, VoxelSelectBoxAction,
  VOXEL_SELECT_CONNECTED_2D, VoxelSelectConnected2dAction,
  VOXEL_SELECT_CONNECTED_3D, VoxelSelectConnected3dAction,
  VOXEL_MAGIN_WAND_2D, VoxelMaginWand2dAction,
  VOXEL_MAGIN_WAND_3D, VoxelMaginWand3dAction,
  VOXEL_CREATE_FRAGMENT, VoxelCreateFragmentAction,
  VOXEL_MOVE_FRAGMENT, VoxelMoveFragmentAction,
  VOXEL_MERGE_FRAGMENT, VoxelMergeFragmentAction,
  VOXEL_REMOVE_SELECTED_2D, VoxelRemoveSelected2dAction,
  VOXEL_REMOVE_SELECTED_3D, VoxelRemoveSelectedAction,
  VOXEL_CLEAR_SELECTION, VoxelClearSelection,
  VOXEL_RESIZE, VoxelResizeAction,
  VOXEL_TRANSFORM, VoxelTransformAction,
  VOXEL_COLOR_FILL_3D, VoxelColorFill3dAction,
  VOXEL_COLOR_FILL_2D, VoxelColorFill2dAction,
  VOXEL_ADD_LIST_2D, VoxelAddList2dAction,
  VOXEL_ADD_LIST_3D, VoxelAddList3dAction,
  VOXEL_PASTE, VoxelPasteAction,
  ENTER_MODE_2D,
  LEAVE_MODE_2D,
  MOVE_MODE_2D_PLANE, MoveMode2DPlaneAction,
} from '../actions';

const initialSize: Position = [16, 16, 16];

const initialModel = ndarray(new Int32Array(initialSize[0] * initialSize[1] * initialSize[2]), initialSize);

const initialState: VoxelData = {
  size: initialSize,
  model: initialModel,
  selection: null,
  fragment: null,
  fragmentOffset: [0, 0, 0],
  mode2d: {
    enabled: false,
    initialized: false,
    axis: Axis.X,
    position: 0,
  }
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

interface MergeFragmentResult {
  model: ndarray.Ndarray;
  selection: ndarray.Ndarray;
}

function mergeFragment(state: VoxelData, leaveSelection: boolean): MergeFragmentResult {
  if (!hasIntersection(state.model.shape, state.fragment.shape, state.fragmentOffset)) {
    return { model: state.model, selection: null };
  }

  const model = ndarray(state.model.data.slice(), state.model.shape);

  const {
    srcOffset,
    destOffset,
    shape,
  } = calculateIntersection(model.shape, state.fragment.shape, state.fragmentOffset);

  const modelOffset = model.offset +
    model.stride[0] * destOffset[0] +
    model.stride[1] * destOffset[1] +
    model.stride[2] * destOffset[2];

  const fragmentOffset = state.fragment.offset +
    state.fragment.stride[0] * srcOffset[0] +
    state.fragment.stride[1] * srcOffset[1] +
    state.fragment.stride[2] * srcOffset[2];

  const intersectInModel = ndarray(model.data, shape, model.stride, modelOffset);
  const intersectInFragment = ndarray(state.fragment.data, shape, state.fragment.stride, fragmentOffset);

  if (leaveSelection) {
    const selection = state.selection
      ? ndarray(state.selection.data.slice(), model.shape)
      : ndarray(new Int32Array(model.shape[0] * model.shape[1] * model.shape[2]), model.shape);
    const intersectInSelection = ndarray(selection.data, shape, selection.stride, modelOffset);

    if (ndAssignAndMask2(intersectInModel, intersectInSelection, intersectInFragment, SELECTION_VALUE)) {
      return { model, selection };
    } else {
      return { model: state.model, selection: state.selection };
    }
  } else {
    if (ndAssign2(intersectInModel, intersectInFragment)) {
      let selection: ndarray.Ndarray = null;

      if (state.selection) {
        const nextSelection = ndarray(state.selection.data.slice(), model.shape);
        const intersectInSelection = ndarray(nextSelection.data, shape, nextSelection.stride, modelOffset);

        ndExclude(intersectInSelection, intersectInFragment);
        selection = ndAny(nextSelection) ? nextSelection : null;
      }

      return { model, selection };
    } else {
      return { model: state.model, selection: state.selection };
    }
  }
}

function ensureFragmentMerged(state: VoxelData, fragmentLeaveSelection: boolean): VoxelData {
  if (!state.fragment) return state;

  const { model, selection } = mergeFragment(state, fragmentLeaveSelection);

  return Object.assign({}, state, {
    model,
    selection,
    fragment: null,
    fragmentOffset: initialState.fragmentOffset,
  });
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
  (clipboard: VoxelPasteAction) => clipboard.model,
  (clipboard: VoxelPasteAction) => clipboard.selection,
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
  const model = ndarray(state.model.data.slice(), state.model.shape);

  let hit: boolean;

  if (!state.selection) {
    hit = updateFn(model);
  } else {
    hit = updateWithSelectionFn(model, state.selection);
  }

  if (!hit) return state;

  return Object.assign({}, state, { model });
}

function reduceModelRemoveAction(
  state: VoxelData,
  removeFn: (model: ndarray.Ndarray) => boolean,
  removeWithSelectionFn: (model: ndarray.Ndarray, selection: ndarray.Ndarray) => boolean
): VoxelData {
  const model = ndarray(state.model.data.slice(), state.model.shape);

  if (!state.selection) {
    if (removeFn(model)) {
      return Object.assign({}, state, { model });
    } else {
      return state;
    }
  } else {
    const selection = ndarray(state.selection.data.slice(), state.selection.shape);
    if (removeWithSelectionFn(model, selection)) {
      const selectionIsValid = ndAny(selection);
      return Object.assign({}, state, {
        model,
        selection: selectionIsValid ? selection : null,
      });
    } else {
      return state;
    }
  }
}

interface Validate2dPosition {
  (x: number, y: number, z: number): boolean;
}

function get2dValidator(axis: Axis, position: number): Validate2dPosition {
  return function(x, y, z) {
    return arguments[axis] === position;
  };
}

function isEmptyInSlice(axis: Axis, position: number, selection: ndarray.Ndarray): boolean {
  return !ndAny(getSlice(axis, position, selection));
}

function filterVolumnWithSlice(axis: Axis, position: number, volumn: Volumn): Volumn {
  if (position < volumn[axis] || position > volumn[axis + 3]) return null;

  const ret = volumn.slice();
  ret[axis] = ret[axis + 3] = position;
  return <Volumn>ret;
}

enum MergeType {
  NONE,
  OVERWRITE,
  ASSIGN,
}

function reduceSelectAction(state: VoxelData, merge: MergeType, selectFn: (selection: ndarray.Ndarray) => boolean): VoxelData {
  const model = state.model;

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

    case VOXEL_ADD_BATCH_2D: {
      const { volumn, color } = <VoxelAddBatch2dAction>action;
      const c = rgbToHex(color);

      const filtered = filterVolumnWithSlice(state.mode2d.axis, state.mode2d.position, volumn);
      if (!filtered) return state;

      const prevState = ensureFragmentMerged(state, true);

      return reduceModelUpsertAction(prevState,
        model => ndFill2(model, filtered, c),
        (model, selection) => isEmptyInSlice(state.mode2d.axis, state.mode2d.position, selection)
          ? ndFill2(model, filtered, c)
          : ndFillWithFilter2(model, filtered, c, selection)
      );
    }

    case VOXEL_ADD_BATCH_3D: {
      const { volumn, color } = <VoxelAddBatch3dAction>action;
      const c = rgbToHex(color);

      const prevState = ensureFragmentMerged(state, true);

      return reduceModelUpsertAction(prevState,
        model => ndFill2(model, volumn, c),
        (model, selection) => ndFillWithFilter2(model, volumn, c, selection)
      );
    }

    case VOXEL_ADD_LIST_2D: {
      const { positions, color } = <VoxelAddList3dAction>action;
      const c = rgbToHex(color);

      const prevState = ensureFragmentMerged(state, true);

      const isValidPosition = get2dValidator(state.mode2d.axis, state.mode2d.position);

      const reduceWithoutSelection = (model: ndarray.Ndarray) => {
        // Skip hit test on the assumption of valid input.
        let hit = false;
        for (let i = 0, len = positions.length; i < len; ++i) {
          const pos = positions[i];
          if (isValidPosition(pos[0], pos[1], pos[2])) {
            model.set(pos[0], pos[1], pos[2], c);
            hit = true;
          }
        }
        return hit;
      }

      return reduceModelUpsertAction(prevState,
        model => reduceWithoutSelection(model),
        (model, selection) => {
          if (isEmptyInSlice(state.mode2d.axis, state.mode2d.position, selection)) {
            return reduceWithoutSelection(model);
          } else {
            let hit = false;
            for (let i = 0, len = positions.length; i < len; ++i) {
              const pos = positions[i];
              if (isValidPosition(pos[0], pos[1], pos[2]) && selection.get(pos[0], pos[1], pos[2])) {
                model.set(pos[0], pos[1], pos[2], c);
                hit = true;
              }
            }
            return hit;
          }
        }
      );
    }

    case VOXEL_ADD_LIST_3D: {
      const { positions, color } = <VoxelAddList3dAction>action;
      const c = rgbToHex(color);

      const prevState = ensureFragmentMerged(state, true);

      return reduceModelUpsertAction(prevState,
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

    case VOXEL_COLOR_FILL_2D: {
      const { position, color } = <VoxelColorFill2dAction>action;
      const c = rgbToHex(color);

      const prevState = ensureFragmentMerged(state, true);

      const isValidPosition = get2dValidator(state.mode2d.axis, state.mode2d.position);

      return reduceModelUpsertAction(prevState,
        model => ndFloodFill(
          model, c, position,
          (x, y, z) => isValidPosition(x, y, z) ? model.get(x, y, z) : undefined
        ),
        (model, selection) => ndFloodFill(
          model, c, position,
          isEmptyInSlice(state.mode2d.axis, state.mode2d.position, selection)
            ? (x, y, z) => isValidPosition(x, y, z) ? model.get(x, y, z) : undefined
            : (x, y, z) => isValidPosition(x, y, z) && selection.get(x, y, z) ? model.get(x, y, z) : undefined
        )
      );
    }

    case VOXEL_COLOR_FILL_3D: {
      const { position, color } = <VoxelColorFill3dAction>action;
      const c = rgbToHex(color);

      const prevState = ensureFragmentMerged(state, true);

      return reduceModelUpsertAction(prevState,
        model => ndFloodFill(model, c, position),
        (model, selection) => ndFloodFill(
          model, c, position, (x, y, z) => selection.get(x, y, z) ? model.get(x, y, z) : undefined
        )
      );
    }

    case VOXEL_REMOVE_LIST_2D: {
      const { positions } = <VoxelRemoveList2dAction>action;

      const prevState = ensureFragmentMerged(state, true);

      const isValidPosition = get2dValidator(state.mode2d.axis, state.mode2d.position);

      const reduceWithoutSelection = (model: ndarray.Ndarray): boolean => {
        let hit = false;
        for (let i = 0, len = positions.length; i < len; ++i) {
          const pos = positions[i];
          if (isValidPosition(pos[0], pos[1], pos[2])) {
            model.set(pos[0], pos[1], pos[2], 0);
            hit = true;
          }
        }
        return hit;
      }

      return reduceModelRemoveAction(prevState,
        model => reduceWithoutSelection(model),
        (model, selection) => {
          if (isEmptyInSlice(state.mode2d.axis, state.mode2d.position, selection)) {
            return reduceWithoutSelection(model);
          } else {
            let hit = false;
            for (let i = 0, len = positions.length; i < len; ++i) {
              const pos = positions[i];
              if (isValidPosition(pos[0], pos[1], pos[2]) && selection.get(pos[0], pos[1], pos[2])) {
                model.set(pos[0], pos[1], pos[2], 0);
                selection.set(pos[0], pos[1], pos[2], 0);
                hit = true;
              }
            }
            return hit;
          }
        }
      );
    }

    case VOXEL_REMOVE_LIST_3D: {
      const { positions } = <VoxelRemoveList3dAction>action;

      const prevState = ensureFragmentMerged(state, true);

      return reduceModelRemoveAction(prevState,
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

    case VOXEL_REMOVE_SELECTED_2D: {
      const prevState = ensureFragmentMerged(state, true);
      if (!prevState.selection) return prevState;

      const prevSelectionSlice = getSlice(state.mode2d.axis, state.mode2d.position, prevState.selection);
      if (!ndAny(prevSelectionSlice)) return prevState;

      const model = ndarray(prevState.model.data.slice(), prevState.model.shape);
      const modelSlice = getSlice(state.mode2d.axis, state.mode2d.position, model);
      ndExclude(modelSlice, prevSelectionSlice);

      const selection = ndarray(prevState.selection.data.slice(), prevState.selection.shape);
      const selectionSlice = getSlice(state.mode2d.axis, state.mode2d.position, selection);
      ndExclude(selectionSlice, prevSelectionSlice);

      return Object.assign({}, prevState, {
        model,
        selection: ndAny(selection) ? selection : null,
      });
    }

    case VOXEL_REMOVE_SELECTED_3D: {
      const prevState = ensureFragmentMerged(state, true);
      if (!prevState.selection) return prevState;

      const model = ndarray(prevState.model.data.slice(), prevState.model.shape);
      ndExclude(model, prevState.selection);

      return Object.assign({}, prevState, {
        model,
        selection: null,
      });
    }

    /*
     * selection update operations
     */

    case VOXEL_SELECT_PROJECTION: {
      const { projectionMatrix, scale, bounds, merge } = <VoxelSelectProjectionAction>action;

      const prevState = ensureFragmentMerged(state, true);

      return reduceSelectAction(prevState, prevState.selection && merge ? MergeType.OVERWRITE : MergeType.NONE, selection => {
        return filterProjection(
          selection, prevState.model, SELECTION_VALUE, scale, projectionMatrix,
          bounds[0], bounds[1], bounds[2], bounds[3]
        );
      });
    }

    case VOXEL_SELECT_BOX: {
      const { volumn, merge } = <VoxelSelectBoxAction>action;

      const prevState = ensureFragmentMerged(state, true);

      return reduceSelectAction(prevState, prevState.selection && merge ? MergeType.OVERWRITE : MergeType.NONE, selection => {
        return ndFillWithFilter2(selection, volumn, SELECTION_VALUE, prevState.model);
      });
    }

    case VOXEL_SELECT_CONNECTED_2D: {
      const { position, merge } = <VoxelSelectConnected2dAction>action;

      const prevState = ensureFragmentMerged(state, true);

      const isValidPosition = get2dValidator(state.mode2d.axis, state.mode2d.position);

      return reduceSelectAction(prevState, state.selection && merge ? MergeType.ASSIGN : MergeType.NONE, selection => {
        return ndFloodFill(selection, SELECTION_VALUE, position, (x, y, z) => {
          return isValidPosition(x, y, z) && (selection.get(x, y, z) || (prevState.model.get(x, y, z) && 1)) || undefined;
        });
      });
    }

    case VOXEL_SELECT_CONNECTED_3D: {
      const { position, merge } = <VoxelSelectConnected3dAction>action;

      const prevState = ensureFragmentMerged(state, true);

      return reduceSelectAction(prevState, state.selection && merge ? MergeType.ASSIGN : MergeType.NONE, selection => {
        return ndFloodFill(selection, SELECTION_VALUE, position, (x, y, z) => {
          return selection.get(x, y, z) || (prevState.model.get(x, y, z) && 1);
        });
      });
    }

    case VOXEL_MAGIN_WAND_2D: {
      const { position, merge } = <VoxelMaginWand2dAction>action;

      const prevState = ensureFragmentMerged(state, true);

      const isValidPosition = get2dValidator(state.mode2d.axis, state.mode2d.position);

      return reduceSelectAction(prevState, prevState.selection && merge ? MergeType.ASSIGN : MergeType.NONE, selection => {
        return ndFloodFill(selection, SELECTION_VALUE, position, (x, y, z) => {
          return isValidPosition(x, y, z) && (selection.get(x, y, z) || prevState.model.get(x, y, z)) || undefined;
        });
      });
    }

    case VOXEL_MAGIN_WAND_3D: {
      const { position, merge } = <VoxelMaginWand3dAction>action;

      const prevState = ensureFragmentMerged(state, true);

      return reduceSelectAction(prevState, prevState.selection && merge ? MergeType.ASSIGN : MergeType.NONE, selection => {
        return ndFloodFill(selection, SELECTION_VALUE, position, (x, y, z) => {
          return selection.get(x, y, z) || prevState.model.get(x, y, z) || undefined;
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
      const { model, selection, fragment, fragmentOffset } = <VoxelCreateFragmentAction>action;

      if (!model || !fragment) return state;

      // Reuse ndarray params for performance reason.
      return Object.assign({}, state, {
        model,
        selection,
        fragment,
        fragmentOffset,
      });
    }

    case VOXEL_PASTE: {
      const fragment = clipboardSelector(<VoxelPasteAction>action);

      const prevState = ensureFragmentMerged(state, false);

      const fragmentOffset = [
        Math.floor((prevState.model.shape[0] - fragment.shape[0]) / 2),
        Math.floor((prevState.model.shape[1] - fragment.shape[1]) / 2),
        Math.floor((prevState.model.shape[2] - fragment.shape[2]) / 2),
      ];

      return Object.assign({}, state, {
        model: prevState.model,
        selection: null,
        fragment,
        fragmentOffset,
      });
    }

    case VOXEL_MOVE_FRAGMENT: {
      const { offset } = <VoxelMoveFragmentAction>action;

      if (   offset[0] === state.fragmentOffset[0]
          && offset[1] === state.fragmentOffset[1]
          && offset[2] === state.fragmentOffset[2]) {
        return state;
      }

      return Object.assign({}, state, {
        fragmentOffset: offset,
      });
    }

    case VOXEL_MERGE_FRAGMENT: {
      return ensureFragmentMerged(state, true);
    }

    /*
     * Etc.
     */

    case VOXEL_RESIZE: {
      const { size, offset } = <VoxelResizeAction>action;

      const prevState = ensureFragmentMerged(state, true);

      const src = prevState.model;
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
      if (prevState.selection) {
        const srcSelection = prevState.selection;
        destSelection = ndarray(new Int32Array(size[0] * size[1] * size[2]), size);

        const srcSelectionIntersect = ndarray(srcSelection.data, shape, srcSelection.stride, srcOffsetSum);
        const destSelectionIntersect = ndarray(destSelection.data, shape, destSelection.stride, destOffsetSum);

        if (!ndAssign2(destSelectionIntersect, srcSelectionIntersect)) destSelection = null;
      }

      return Object.assign({}, prevState, {
        size,
        model: dest,
        selection: destSelection,
      });
    }

    case VOXEL_TRANSFORM: {
      const { transform } = <VoxelTransformAction>action;

      const prevState = ensureFragmentMerged(state, true);

      // Infer next shape from transform and current size
      const { shape } = prevState.model;
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
            const c = prevState.model.get(i, j, k);
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

      if (prevState.selection) {
        selection = ndarray(new Int32Array(w * h * d), [w, h ,d]);

        for (let i = 0; i < shape[0]; ++i) {
          for (let j = 0; j < shape[1]; ++j) {
            for (let k = 0; k < shape[2]; ++k) {
              const c = prevState.selection.get(i, j, k);
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

      return Object.assign({}, prevState, {
        size: model.shape,
        model,
        selection,
      });
    }

    case ENTER_MODE_2D: {
      if (state.mode2d.enabled === true) return state;

      if (state.mode2d.initialized) {
        return Object.assign({}, state, {
          mode2d: Object.assign({}, state.mode2d, { enabled: true }),
        });
      } else {
        return Object.assign({}, state, {
          mode2d: Object.assign({}, state.mode2d, {
            enabled: true,
            initialized: true,
            axis: Axis.X,
            position: Math.floor(state.size[0] / 2),
          }),
        });
      }
    }

    case LEAVE_MODE_2D: {
      if (state.mode2d.enabled === false) return state;

      return Object.assign({}, state, {
        mode2d: Object.assign({}, state.mode2d, { enabled: false }),
      });
    }

    case MOVE_MODE_2D_PLANE: {
      const { axis, position } = <MoveMode2DPlaneAction>action;
      if (state.mode2d.axis === axis && state.mode2d.position === position) return state;

      return Object.assign({}, state, {
        mode2d: Object.assign({}, state.mode2d, {
          axis, position,
        }),
      });
    }

    default: {
      return state;
    }
  }
}

export default undoable(voxelDataReducer);
