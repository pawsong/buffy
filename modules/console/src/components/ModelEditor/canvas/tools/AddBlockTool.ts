import THREE from 'three';
import * as ndarray from 'ndarray';

import { Schema, SchemaType } from '@pasta/helper/lib/diff';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  Color,
  ToolType,
  ModelEditorState,
  Position,
} from '../../types';

import {
  voxelMergeFragment,
} from '../../actions';

import {
  PIXEL_SCALE,
} from '../../../../canvas/Constants';

import SelectionBox from '../objects/SelectionBox';

const gridVertexShader = require('raw!../shaders/grid2.vert');
const gridFragmentShader = require('raw!../shaders/grid2.frag');

import CursorState from './states/CursorState';

class GridSelectionBox extends SelectionBox {
  color: THREE.Vector3;
  scale: THREE.Vector3;

  createMesh() {
    this.color = new THREE.Vector3();
    this.scale = new THREE.Vector3();

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.translate(0.5, 0.5, 0.5);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: this.color },
        scale: { value: this.scale },
        opacity: { type: 'f', value: 0.5 },
      },
      vertexShader: gridVertexShader,
      fragmentShader: gridFragmentShader,
      transparent: true,
    });
    material.extensions.derivatives = true;

    return new THREE.Mesh(geometry, material);
  }

  show(visible: boolean) {
    this.mesh.visible = visible;
  }

  resize(width: number, height: number, depth: number) {
    this.scale.set(width, height, depth);
    this.mesh.scale.copy(this.scale).multiplyScalar(PIXEL_SCALE);
  }
}

interface AddBlockToolProps {
  size: Position;
  color: Color;
  fragment: ndarray.Ndarray;
}

interface AddBlockToolTree {
  color: Color;
}

abstract class AddBlockTool extends ModelEditorTool<AddBlockToolProps, void, AddBlockToolTree> {
  selectionBox: GridSelectionBox;

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        color: { type: SchemaType.ANY },
      },
    };
  }

  mapParamsToProps(state: ModelEditorState) {
    return {
      size: state.file.present.data.size,
      color: state.common.paletteColor,
      fragment: state.file.present.data.fragment,
    };
  }

  render() { return this.props; }

  patch(diff: AddBlockToolTree) {
    if (diff.hasOwnProperty('color')) {
      this.selectionBox.color.set(diff.color.r / 0xff, diff.color.g / 0xff, diff.color.b / 0xff);
    }
  }

  onInit(params: InitParams) {
    super.onInit(params);
    this.selectionBox = new GridSelectionBox();
  }

  onStart() {
    this.canvas.scene.add(this.selectionBox.mesh);
  }

  onStop() {
    this.canvas.scene.remove(this.selectionBox.mesh);
  }

  onDestroy() {

  }
}

abstract class AddBlockToolWaitState<T> extends CursorState<T> {
  constructor(protected tool: AddBlockTool) {
    super(tool.canvas, {
      cursorOnFace: true,
      cursorMesh: tool.selectionBox.mesh,
      getSize: () => tool.props.size,
      getInteractables: () => [
        tool.canvas.component.plane,
        tool.canvas.component.modelMesh,
        tool.canvas.component.fragmentMesh,
      ],
    });
  }

  onMouseDown() {
    if (this.tool.props.fragment) this.tool.dispatchAction(voxelMergeFragment());
  }

  onEnter() {
    this.tool.selectionBox.resize(1, 1, 1);
    super.onEnter();
  }

  onLeave() {
    super.onLeave();
    this.tool.selectionBox.show(false);
  }
}

export default AddBlockTool;
export { AddBlockToolWaitState }
