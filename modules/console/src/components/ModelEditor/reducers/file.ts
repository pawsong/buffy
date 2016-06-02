import * as ndarray from 'ndarray';

import undoable from '@pasta/helper/lib/undoable';
const floodFill = require('n-dimensional-flood-fill');

import {
  Position,
  Action,
  Voxel,
  Volumn,
  VoxelData,
  Transformation,
} from '../types';

import {
  VOXEL_ADD, VoxelAddAction,
  VOXEL_ADD_BATCH, VoxelAddBatchAction,
  VOXEL_REMOVE, VoxelRemoveAction,
  VOXEL_REMOVE_BATCH, VoxelRemoveBatchAction,
  VOXEL_ROTATE, VoxelRotateAction,
  VOXEL_SELECT, VoxelSelectAction,
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

export function rgbToHex({ r, g, b }) {
  return (1 << 24) /* Used by mesher */ | (r << 16) | (g << 8) | b;
}

type Shape = [number /* width */, number /* height */, number /* depth */];

interface RotateFn {
  (shape: Shape, position: Position): Position;
}

const cwise = require('cwise');

const any = cwise({
  args: ['array'],
  body: function(a) {
    if (a) return true;
  },
  post: function() {
    return false
  },
});

const fill = (() => {
  const _fill = cwise({
    args: ['array', 'scalar'],
    body: function(a, s) {
      a = s;
    },
  });

  return function (array: ndarray.Ndarray, volumn: Volumn, c: number) {
    const offset = array.stride[0] * volumn[0] +
                   array.stride[1] * volumn[1] +
                   array.stride[2] * volumn[2];

    const shape = [
      volumn[3] - volumn[0] + 1,
      volumn[4] - volumn[1] + 1,
      volumn[5] - volumn[2] + 1,
    ];

    const _array = ndarray(array.data, shape, array.stride, offset);
    _fill(_array, c);
  };
})();

const fillInSelection = (() => {
  const _fillInSelection = cwise({
    args: ['array', 'array', 'scalar'],
    pre: function () {
      this.changed = false;
    },
    body: function (model, selection, color) {
      if (selection) {
        model = color;
        this.changed = true;
      }
    },
    post: function () {
      return this.changed;
    },
  });

  return function (array: ndarray.Ndarray, volumn: Volumn, c: number, selection: ndarray.Ndarray): boolean {
    const offset = array.stride[0] * volumn[0] +
                   array.stride[1] * volumn[1] +
                   array.stride[2] * volumn[2];

    const shape = [
      volumn[3] - volumn[0] + 1,
      volumn[4] - volumn[1] + 1,
      volumn[5] - volumn[2] + 1,
    ];

    const _array = ndarray(array.data, shape, array.stride, offset);
    const _selection = ndarray(selection.data, shape, selection.stride, offset);

    return _fillInSelection(_array, _selection, c);
  };
})();

const selectWithBox = (() => {
  const _selectWithBox = cwise({
    args: ['array', 'array'],
    pre: function () {
      this.selected = false;
    },
    body: function (selection, model) {
      if (model) {
        selection = 1;
        this.selected = true;
      }
    },
    post: function () {
      return this.selected;
    },
  });

  return function (selection: ndarray.Ndarray, model: ndarray.Ndarray, volumn: Volumn): boolean {
    const offset = model.stride[0] * volumn[0] +
                   model.stride[1] * volumn[1] +
                   model.stride[2] * volumn[2];

    const shape = [
      volumn[3] - volumn[0] + 1,
      volumn[4] - volumn[1] + 1,
      volumn[5] - volumn[2] + 1,
    ];

    const _model = ndarray(model.data, shape, model.stride, offset);
    const _selection = ndarray(selection.data, shape, selection.stride, offset);

    return _selectWithBox(_selection, _model);
  };
})();

const removeInSelection = (() => {
  const _removeInSelection = cwise({
    args: ['array', 'array'],
    body: function (model, selection) {
      if (selection) {
        model = 0;
      }
    },
  });

  return (model: ndarray.Ndarray, selection: ndarray.Ndarray) => {
    return _removeInSelection(model, selection);
  };
})();

const mergeFragmentIntoModel = (() => {
  const _mergeFragmentIntoModel = cwise({
    args: ['array', 'array', 'array'],
    pre: function () {
      this.selected = false;
    },
    body: function (model, selection, fragment) {
      if (fragment) {
        selection = 1;
        model = fragment;
        this.selected = true;
      }
    },
    post: function () {
      return this.selected;
    }
  });

  return (model: ndarray.Ndarray, selection: ndarray.Ndarray, fragment: ndarray.Ndarray): boolean => {
    return _mergeFragmentIntoModel(model, selection, fragment);
  };
})();

const resizeModel = (() => {
  const _resizeModel = cwise({
    args: ['array', 'array'],
    body: function (next, prev) {
      if (prev) next = prev;
    },
  });

  return (model: ndarray.Ndarray, size: Position, offset: Position): ndarray.Ndarray => {
    const nextModel = ndarray(new Int32Array(size[0] * size[1] * size[2]), size);

    const prevDataOffset =
      model.stride[0] * offset[0] +
      model.stride[1] * offset[1] +
      model.stride[2] * offset[2];

    const prevModel = ndarray(model.data, size, model.stride, prevDataOffset);

    _resizeModel(nextModel, prevModel);

    return nextModel;
  };
})();

const resizeModelAndSelection = (() => {
  const _mergeFragmentIntoModel = cwise({
    args: ['array', 'array', 'array'],
    pre: function () {
      this.selected = false;
    },
    body: function (model, selection, fragment) {
      if (fragment) {
        selection = 1;
        model = fragment;
        this.selected = true;
      }
    },
    post: function () {
      return this.selected;
    }
  });

  return (model: ndarray.Ndarray, selection: ndarray.Ndarray, fragment: ndarray.Ndarray): boolean => {
    return _mergeFragmentIntoModel(model, selection, fragment);
  };
})();

const merge = (() => {
  const _merge = cwise({
    args: ['array', 'array'],
    body: function (dest, src) {
      if (src) dest = src;
    },
  });

  return (dest: ndarray.Ndarray, src: ndarray.Ndarray): boolean => {
    return _merge(dest, src);
  };
})();

const rotates: { [index: string]: RotateFn } = {
  x: (shape, pos) => ([ pos[0],            shape[2] - pos[2], pos[1]            ]),
  y: (shape, pos) => ([ pos[2],            pos[1],            shape[0] - pos[0] ]),
  z: (shape, pos) => ([ shape[1] - pos[1], pos[0],            pos[2]            ]),
};

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

function voxelDataReducer(state = initialState, action: Action<any>): VoxelData {
  switch (action.type) {
    case VOXEL_ADD_BATCH: {
      const { volumn, color } = <VoxelAddBatchAction>action;
      const c = rgbToHex(color);
      const matrix = ndarray(state.matrix.data.slice(), state.matrix.shape);

      if (!state.selection) {
        fill(matrix, volumn, c);
      } else {
        if (!fillInSelection(matrix, volumn, c, state.selection)) {
          return state;
        }
      }

      return Object.assign({}, state, {
        matrix,
      });
    }

    case VOXEL_SELECT: {
      const { selection } = <VoxelSelectAction>action;
      return Object.assign({}, state, { selection });
    }

    case VOXEL_SELECT_BOX: {
      const { volumn, merge } = <VoxelSelectBoxAction>action;

      let selection: ndarray.Ndarray;
      if (state.selection && merge) {
        selection = ndarray(state.selection.data.slice(),
          state.matrix.shape
        );
      } else {
        selection = ndarray(
          new Int32Array(state.matrix.shape[0] * state.matrix.shape[1] * state.matrix.shape[2]),
          state.matrix.shape
        );
      }

      const selected = selectWithBox(selection, state.matrix, volumn);

      if (!selected && !state.selection) return state;

      return Object.assign({}, state, {
        selection: selected ? selection : null,
      });
    }

    case VOXEL_SELECT_CONNECTED: {
      const { position, merge } = <VoxelSelectConnectedAction>action;

      let selection: ndarray.Ndarray;
      if (state.selection && merge) {
        selection = ndarray(state.selection.data.slice(),
          state.matrix.shape
        );
      } else {
        selection = ndarray(
          new Int32Array(state.matrix.shape[0] * state.matrix.shape[1] * state.matrix.shape[2]),
          state.matrix.shape
        );
      }

      floodFill({
        getter: (x: number, y: number, z: number) => {
          if (
               x < 0 || x >= state.matrix.shape[0]
            || y < 0 || y >= state.matrix.shape[1]
            || z < 0 || z >= state.matrix.shape[2]
          ) {
            return;
          }

          return state.matrix.get(x, y, z) !== 0;
        },
        onFlood: (x: number, y: number, z: number) => {
          selection.set(x, y, z, 1);
        },
        seed: position,
      });

      return Object.assign({}, state, { selection });
    }

    case VOXEL_MAGIN_WAND: {
      const { position, merge } = <VoxelMaginWandAction>action;

      let selection: ndarray.Ndarray;
      if (state.selection && merge) {
        selection = ndarray(state.selection.data.slice(),
          state.matrix.shape
        );
      } else {
        selection = ndarray(
          new Int32Array(state.matrix.shape[0] * state.matrix.shape[1] * state.matrix.shape[2]),
          state.matrix.shape
        );
      }

      const c = state.matrix.get(position[2], position[1], position[0]);

      floodFill({
        getter: (x: number, y: number, z: number) => {
          if (
               x < 0 || x >= state.matrix.shape[0]
            || y < 0 || y >= state.matrix.shape[1]
            || z < 0 || z >= state.matrix.shape[2]
          ) {
            return;
          }

          return state.matrix.get(x, y, z);
        },
        onFlood: (x: number, y: number, z: number) => {
          selection.set(x, y, z, 1);
        },
        seed: position,
      });

      return Object.assign({}, state, { selection });
    }

    case VOXEL_COLOR_FILL: {
      const { position, color } = <VoxelColorFillAction>action;
      function checkBoundary(x: number, y: number, z: number): boolean {
        if (
             x < 0 || x >= state.matrix.shape[0]
          || y < 0 || y >= state.matrix.shape[1]
          || z < 0 || z >= state.matrix.shape[2]
        ) {
          return false;
        } else {
          return true;
        }
      }

      let getter: (x: number, y: number, z: number) => number;
      if (state.selection) {
        if (!state.selection.get(position[0], position[1], position[2])) {
          return state;
        }

        getter = (x: number, y: number, z: number) => {
          if (!checkBoundary(x, y, z)) return;
          if (!state.selection.get(x, y, z)) return;
          return state.matrix.get(x, y, z);
        }
      } else {
        getter = (x: number, y: number, z: number) => {
          if (!checkBoundary(x, y, z)) return;
          return state.matrix.get(x, y, z);
        }
      }

      const c = rgbToHex(color);

      const model = ndarray(state.matrix.data.slice(), state.matrix.shape);

      floodFill({
        getter,
        onFlood: (x: number, y: number, z: number) => {
          model.set(x, y, z, c);
        },
        seed: position,
      });

      return Object.assign({}, state, { matrix: model });
    }

    case VOXEL_CLEAR_SELECTION: {
      if (!state.selection) return;
      return Object.assign({}, state, { selection: null });
    }

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

    case VOXEL_MOVE_FRAGMENT: {
      const { offset } = <VoxelMoveFragmentAction>action;

      return Object.assign({}, state, {
        fragmentOffset: offset,
      });
    }

    case VOXEL_MERGE_FRAGMENT: {
      if (!state.fragment) return state;

      const fShape = state.fragment.shape;
      const fOffset = state.fragmentOffset;

      if (
          fOffset[0] <= -fShape[0] || fOffset[0] >= fShape[0]
       || fOffset[1] <= -fShape[1] || fOffset[1] >= fShape[1]
       || fOffset[2] <= -fShape[2] || fOffset[2] >= fShape[2]
      ) {
        return Object.assign({}, state, {
          selection: null,
          fragment: null,
          fragmentOffset: [0, 0, 0],
        });
      }

      const model = ndarray(state.matrix.data.slice(), state.matrix.shape);
      const selection = ndarray(
        new Int32Array(state.fragment.shape[0] * state.fragment.shape[1] * state.fragment.shape[2]),
        state.fragment.shape
      );

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
        model.stride[0] * srcOffset[0] +
        model.stride[1] * srcOffset[1] +
        model.stride[2] * srcOffset[2];

      const intersectionInModel = ndarray(model.data, shape, model.stride, modelOffset);
      const intersectionInSelection = ndarray(selection.data, shape, selection.stride, modelOffset);
      const intersectionInFragment = ndarray(state.fragment.data, shape, state.fragment.stride, fragmentOffset);

      const selected = mergeFragmentIntoModel(intersectionInModel, intersectionInSelection, intersectionInFragment);

      return Object.assign({}, state, {
        matrix: model,
        selection: selected ? selection : null,
        fragment: null,
        fragmentOffset: [0, 0, 0],
      });
    }

    case VOXEL_REMOVE_BATCH: {
      const { positions } = <VoxelRemoveBatchAction>action;

      if (!state.selection) {
        const matrix = ndarray(state.matrix.data.slice(), state.matrix.shape);
        positions.forEach(position => {
          matrix.set(position[0], position[1], position[2], 0);
        });

        return Object.assign({}, state, {
          matrix,
        });
      } else {
        let changed = false;

        const matrix = ndarray(state.matrix.data.slice(), state.matrix.shape);
        const selection = ndarray(state.selection.data.slice(), state.selection.shape);

        positions.forEach(position => {
          if (selection.get(position[0], position[1], position[2])) {
            matrix.set(position[0], position[1], position[2], 0);
            selection.set(position[0], position[1], position[2], 0);
            changed = true;
          }
        });

        if (!changed) return state;

        const selected = any(selection);

        return Object.assign({}, state, {
          matrix,
          selection: selected ? selection : null,
        });
      }
    }

    case VOXEL_REMOVE_SELECTED: {
      if (!state.selection) return;

      const matrix = ndarray(state.matrix.data.slice(), state.matrix.shape);
      removeInSelection(matrix, state.selection);

      return Object.assign({}, state, {
        matrix,
        selection: null,
      });
    }

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

      merge(destIntersect, srcIntersect);

      let destSelection = null;
      if (state.selection) {
        const srcSelection = state.selection;
        destSelection = ndarray(new Int32Array(size[0] * size[1] * size[2]), size);

        const srcSelectionIntersect = ndarray(srcSelection.data, shape, srcSelection.stride, srcOffsetSum);
        const destSelectionIntersect = ndarray(destSelection.data, shape, destSelection.stride, destOffsetSum);

        merge(destSelectionIntersect, srcSelectionIntersect);
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
        matrix: model,
        selection,
      });
    }

    case VOXEL_ROTATE: {
      const { axis } = <VoxelRotateAction>action;
      const rotate = rotates[axis];
      if (!rotate) return state;

      const width = state.matrix.shape[0];
      const height = state.matrix.shape[1];
      const depth = state.matrix.shape[2];
      const matrix = ndarray(new Int32Array(width * height * depth), state.matrix.shape);

      // TODO: Support user define shape
      const shape: Shape = state.size;

      for (let k = 0; k < depth; ++k) {
        for (let j = 0; j < height; ++j) {
          for (let i = 0; i < width; ++i) {
            const c = state.matrix.get(i, j, k);
            if (c === 0) continue;
            const pos = rotate(shape, [i, j, k]);
            matrix.set(pos[0], pos[1], pos[2], c);
          }
        }
      }

      if (!state.selection) {
        return Object.assign({}, state, {
          matrix,
        });
      } else {
        const selection = ndarray(new Int32Array(width * height * depth), state.selection.shape);

        for (let k = 0; k < depth; ++k) {
          for (let j = 0; j < height; ++j) {
            for (let i = 0; i < width; ++i) {
              const c = state.selection.get(i, j, k);
              if (c === 0) continue;

              const pos = rotate(shape, [i, j, k]);
              selection.set(pos[0], pos[1], pos[2], c);
            }
          }
        }

        return Object.assign({}, state, {
          matrix,
          selection,
        });
      }
    }

    default: {
      return state;
    }
  }
}

export default undoable(voxelDataReducer);
