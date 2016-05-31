import * as THREE from 'three';
import * as ndarray from 'ndarray';
const cwise = require('cwise');

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  ToolType,
  Volumn,
  ModelEditorState,
} from '../../types';

import {
  voxelSelectBox,
  voxelClearSelection,
  voxelMergeFragment,
  voxelSelect,
  VoxelClearSelection,
} from '../../actions';

import {
  PIXEL_SCALE,
} from '../../../../canvas/Constants';

import CursorState from './states/CursorState';
import SelectBoxState, { EnterParams } from './states/SelectBoxState';

import SelectionBox from '../objects/SelectionBox';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAW = 'draw';

const filter = (() => {
  const _filter = cwise({
    args: [
      'index', 'array', 'array', 'scalar',
      'scalar', 'scalar', 'scalar', 'scalar', 'scalar', 'scalar',
      'scalar', 'scalar', 'scalar', 'scalar', 'scalar', 'scalar',
      'scalar', 'scalar', 'scalar', 'scalar',
    ],
    pre: function () {
      this.selected = false;
    },
    body: function (
      i, selection, model, scale,
      e0, e1, e3, e4,  e5, e7,
      e8, e9, e11, e12, e13, e15,
      lo0, lo1, hi0, hi1
    ) {
      if (model) {
        // Apply projection
        var x = (i[0] + 0.5) * scale;
        var y = (i[1] + 0.5) * scale;
        var z = (i[2] + 0.5) * scale;

        var d = 1 / ( e3 * x + e7 * y + e11 * z + e15 ); // perspective divide
        var u = ( e0 * x + e4 * y + e8  * z + e12 ) * d;
        var v = ( e1 * x + e5 * y + e9  * z + e13 ) * d;

        if (u >= lo0 && u < hi0 && v >= lo1 && v < hi1) {
          selection = 1;
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
    scale: number,
    projectionMatrix: THREE.Matrix4,
    lo0: number, lo1: number, hi0: number, hi1: number
  ) {
		const e = projectionMatrix.elements;
    return _filter(
      selection, model, scale,
      e[0], e[1], e[3], e[4], e[5], e[7],
      e[8], e[9], e[11], e[12], e[13], e[15],
      lo0, lo1, hi0, hi1
    );
  };
})();

interface BoxSelectToolProps {
  model: ndarray.Ndarray;
  selection: ndarray.Ndarray;
  fragment: ndarray.Ndarray;
}

const T = 2; // Selection thickness
const SELECTION_STROKE_COLOR = '#FFEB3B'; // Selection color

class RectangleSelectTool extends ModelEditorTool<BoxSelectToolProps, void, void> {
  canvasElement: HTMLCanvasElement;
  private selectionCtx: CanvasRenderingContext2D;

  getToolType() { return ToolType.RECTANGLE_SELECT; }

  mapParamsToProps(state: ModelEditorState) {
    return {
      model: state.file.present.data.matrix,
      selection: state.file.present.data.selection,
      fragment: state.file.present.data.fragment,
    };
  }

  resetSelectionCanvas() {
    this.selectionCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }

  showSelectionRect(visible: boolean) {
    this.canvasElement.style.display = visible ? 'block' : 'none';
  }

  drawSelectionRect(loX, loY, hiX, hiY) {
    this.resetSelectionCanvas();

    const w = hiX - loX;
    const h = hiY - loY;

    this.selectionCtx.fillRect(loX,         loY,         w,     T);
    this.selectionCtx.fillRect(loX,         loY,         T,     h);
    this.selectionCtx.fillRect(loX + w - T, loY,         T,     h);
    this.selectionCtx.fillRect(loX,         loY + h - T, w,     T);
  }

  onInit(params: InitParams) {
    super.onInit(params);

    this.canvasElement = document.createElement('canvas');
    this.canvasElement.style.display = 'none';
    this.canvasElement.style.position = 'absolute';
    this.canvasElement.style.top = '0';
    this.canvasElement.style.left = '0';
    this.canvasElement.width = this.canvas.container.clientWidth;
    this.canvasElement.height = this.canvas.container.clientHeight;
    this.canvas.container.appendChild(this.canvasElement);

    this.selectionCtx = this.canvasElement.getContext('2d');
    this.selectionCtx.fillStyle = SELECTION_STROKE_COLOR;
  }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAW]: new DrawState(this),
    };
  }

  onResize() {
    this.canvasElement.width = this.canvas.container.clientWidth;
    this.canvasElement.height = this.canvas.container.clientHeight;

    this.selectionCtx.fillStyle = SELECTION_STROKE_COLOR;
  }

  onDestroy() {

  }
}

class WaitState extends ToolState {
  constructor(private tool: RectangleSelectTool) {
    super();
  }

  handleMouseDown = (e: MouseEvent) => {
    if (e.which !== 1) return;

    this.transitionTo(STATE_DRAW, e);
  }

  onEnter() {
    this.tool.canvas.container.addEventListener('mousedown', this.handleMouseDown, false);
  }

  onLeave() {
    this.tool.canvas.container.removeEventListener('mousedown', this.handleMouseDown, false);
  }
}

class DrawState extends ToolState {
  private static getBoundingRect(origin: THREE.Vector2, e: MouseEvent, lo: THREE.Vector2, hi: THREE.Vector2) {
    if (e.offsetX > origin.x) {
      hi.x = e.offsetX;
      lo.x = origin.x;
    } else {
      hi.x = origin.x;
      lo.x = e.offsetX;
    }

    if (e.offsetY > origin.y) {
      hi.y = e.offsetY;
      lo.y = origin.y;
    } else {
      hi.y = origin.y;
      lo.y = e.offsetY;
    }
  }

  private origin: THREE.Vector2;
  private lo: THREE.Vector2;
  private hi: THREE.Vector2;
  private matrix: THREE.Matrix4;

  constructor(private tool: RectangleSelectTool) {
    super();
    this.origin = new THREE.Vector2();
    this.lo = new THREE.Vector2();
    this.hi = new THREE.Vector2();
    this.matrix = new THREE.Matrix4();
  }

  onContextMenu = (e: MouseEvent) => e.preventDefault();

  handleMouseMove = (e: MouseEvent) => {
    e.preventDefault();

    DrawState.getBoundingRect(this.origin, e, this.lo, this.hi);
    this.tool.drawSelectionRect(this.lo.x, this.lo.y, this.hi.x, this.hi.y);
  }

  handleMouseUp = (event: MouseEvent) => {
    event.preventDefault();

    DrawState.getBoundingRect(this.origin, event, this.lo, this.hi);

    // Normalized
    const lo0 = (this.lo.x / this.tool.canvas.container.clientWidth) * 2 - 1;
    const lo1 = -(this.hi.y / this.tool.canvas.container.clientHeight) * 2 + 1;
    const hi0 = (this.hi.x / this.tool.canvas.container.clientWidth) * 2 - 1;
    const hi1 = -(this.lo.y / this.tool.canvas.container.clientHeight) * 2 + 1;

    const { camera } = this.tool.canvas;
    this.matrix.multiplyMatrices(camera.projectionMatrix, this.matrix.getInverse(camera.matrixWorld));

    const { model } = this.tool.props;
    const selection = ndarray(new Int32Array(model.shape[0] * model.shape[1] * model.shape[2]), model.shape);

    const selected = filter(selection, this.tool.props.model, PIXEL_SCALE, this.matrix, lo0, lo1, hi0, hi1);

    if (selected) {
      this.tool.dispatchAction(voxelSelect(selection));
    } else if (this.tool.props.selection) {
      this.tool.dispatchAction(voxelClearSelection());
    }

    this.transitionTo(STATE_WAIT);
  }

  onEnter(e: MouseEvent) {
    this.origin.set(e.offsetX, e.offsetY);

    this.tool.resetSelectionCanvas();
    this.tool.showSelectionRect(true);

    this.tool.canvasElement.addEventListener('contextmenu', this.onContextMenu, false );
    this.tool.canvasElement.addEventListener('mousemove', this.handleMouseMove, false);
    this.tool.canvasElement.addEventListener('mouseup', this.handleMouseUp, false);
  }

  onLeave() {
    this.tool.showSelectionRect(false);

    this.tool.canvasElement.removeEventListener('contextmenu', this.onContextMenu, false);
    this.tool.canvasElement.removeEventListener('mousemove', this.handleMouseMove, false);
    this.tool.canvasElement.removeEventListener('mouseup', this.handleMouseUp, false);
  }
}

export default RectangleSelectTool;
