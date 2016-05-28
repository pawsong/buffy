import * as ndarray from 'ndarray';

import undoable from '@pasta/helper/lib/undoable';
const floodFill = require('n-dimensional-flood-fill');

import {
  Position,
  Action,
  Voxel,
  Volumn,
  VoxelData,
} from '../types';

import {
  VOXEL_ADD, VoxelAddAction,
  VOXEL_ADD_BATCH, VoxelAddBatchAction,
  VOXEL_REMOVE, VoxelRemoveAction,
  VOXEL_REMOVE_BATCH, VoxelRemoveBatchAction,
  VOXEL_ROTATE, VoxelRotateAction,
  VOXEL_SELECT_BOX, VoxelSelectBoxAction,
  VOXEL_MAGIN_WAND, VoxelMaginWandAction,
  VOXEL_MOVE_START, VoxelMoveStartAction,
  VOXEL_MOVE_END, VoxelMoveEndAction,
  VOXEL_REMOVE_SELECTED, VoxelRemoveSelectedAction,
} from '../actions';

import {
  DESIGN_IMG_SIZE,
} from '../../../canvas/Constants';

import mesher from '../../../canvas/meshers/greedy';

const initialMatrix = ndarray(new Int32Array(16 * 16 * 16), [16, 16, 16]);
initialMatrix.set(0,1,1, 1 << 24 | 0xff << 8);
initialMatrix.set(1,1,1, 1 << 24 | 0xff << 8);

const initialState: VoxelData = {
  matrix: initialMatrix,
  mesh: mesher(initialMatrix),
  selection: null,
  selectionMesh: null,
  fragment: null,
  fragmentMesh: null,
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

const rotates: { [index: string]: RotateFn } = {
  x: (shape, pos) => ([ pos[0],            shape[2] - pos[2], pos[1]            ]),
  y: (shape, pos) => ([ pos[2],            pos[1],            shape[0] - pos[0] ]),
  z: (shape, pos) => ([ shape[1] - pos[1], pos[0],            pos[2]            ]),
};

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
        mesh: mesher(matrix),
      });
    }

    case VOXEL_SELECT_BOX: {
      const { volumn } = <VoxelSelectBoxAction>action;
      const selection = ndarray(
        new Int32Array(state.matrix.shape[0] * state.matrix.shape[1] * state.matrix.shape[2]),
        state.matrix.shape
      );

      const selected = selectWithBox(selection, state.matrix, volumn);

      if (!selected && !state.selection) return state;

      return Object.assign({}, state, {
        selection: selected ? selection : null,
        selectionMesh: selected ? mesher(selection) : null,
      });
    }

    case VOXEL_MAGIN_WAND: {
      const { position } = <VoxelMaginWandAction>action;

      const c = state.matrix.get(position[2], position[1], position[0]);

      const selection = ndarray(
        new Int32Array(state.matrix.shape[0] * state.matrix.shape[1] * state.matrix.shape[2]),
        state.matrix.shape
      );

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

      return Object.assign({}, state, {
        selection,
        selectionMesh: mesher(selection),
      });
    }

    case VOXEL_MOVE_START: {
      if (!state.selection) return state;

      const matrix = ndarray(state.matrix.data.slice(), state.matrix.shape);
      const fragment = ndarray(
        new Int32Array(state.selection.shape[0] * state.selection.shape[1] * state.selection.shape[2]),
        state.selection.shape
      );

      const { shape } = state.selection;
      for (let k = 0; k < shape[2]; ++k) {
        for (let j = 0; j < shape[1]; ++j) {
          for (let i = 0; i < shape[0]; ++i) {
            if (state.selection.get(i, j, k) !== 0) {
              fragment.set(i, j, k, matrix.get(i, j, k));
              matrix.set(i, j, k, 0);
            }
          }
        }
      }

      return Object.assign({}, state, {
        matrix,
        mesh: mesher(matrix),
        selection: null,
        selectionMesh: null,
        fragment,
        fragmentMesh: mesher(fragment),
      });
    }

    case VOXEL_MOVE_END: {
      if (!state.fragment) return state;

      const { offset } = <VoxelMoveEndAction>action;

      const matrix = ndarray(state.matrix.data.slice(), state.matrix.shape);
      const selection = ndarray(
        new Int32Array(state.fragment.shape[0] * state.fragment.shape[1] * state.fragment.shape[2]),
        state.fragment.shape
      );

      const { shape } = state.fragment;

      const minX = Math.max(0,        offset[0]           );
      const maxX = Math.min(shape[0], offset[0] + shape[0]);
      const minY = Math.max(0,        offset[1]           );
      const maxY = Math.min(shape[1], offset[1] + shape[1]);
      const minZ = Math.max(0,        offset[2]           );
      const maxZ = Math.max(shape[2], offset[2] + shape[2]);

      let selected = false;

      for (let k = minZ; k < maxZ; ++k) {
        for (let j = minY; j < maxY; ++j) {
          for (let i = minX; i < maxX; ++i) {
            const c = state.fragment.get(i - offset[0], j - offset[1], k - offset[2]);
            if (c !== 0) {
              matrix.set(i, j, k, c);
              selection.set(i, j, k, c);
              selected = true;
            }
          }
        }
      }

      return Object.assign({}, state, {
        matrix,
        mesh: mesher(matrix),
        selection: selected ? selection : null,
        selectionMesh: selected ? mesher(selection) : null,
        fragment: null,
        fragmentMesh: null,
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
          mesh: mesher(matrix),
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
          mesh: mesher(matrix),
          selection: selected ? selection : null,
          selectionMesh: selected ? mesher(selection) : null,
        });
      }
    }

    case VOXEL_REMOVE_SELECTED: {
      if (!state.selection) return;

      const matrix = ndarray(state.matrix.data.slice(), state.matrix.shape);
      removeInSelection(matrix, state.selection);

      return Object.assign({}, state, {
        matrix,
        mesh: mesher(matrix),
        selection: null,
        selectionMesh: null,
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
      const shape: Shape = [ DESIGN_IMG_SIZE, DESIGN_IMG_SIZE, DESIGN_IMG_SIZE ];

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
          mesh: mesher(matrix),
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
          mesh: mesher(matrix),
          selection,
          selectionMesh: mesher(selection),
        });
      }
    }

    default: {
      return state;
    }
  }
}

export default undoable(voxelDataReducer);