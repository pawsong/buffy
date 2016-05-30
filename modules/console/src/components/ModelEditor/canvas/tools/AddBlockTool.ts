import * as THREE from 'three';
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
} from '../../types';

import {
  voxelMergeFragment,
} from '../../actions';

import {
  PIXEL_SCALE,
  DESIGN_IMG_SIZE,
} from '../../../../canvas/Constants';

import SelectionBox from '../objects/SelectionBox';

const gridVertexShader = require('raw!../shaders/grid2.vert');
const gridFragmentShader = require('raw!../shaders/grid2.frag');

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

abstract class AddBlockToolWaitState<T> extends ToolState {
  cursor: Cursor;

  private drawState: string;

  abstract getDrawStateName(): string;
  abstract getDrawStateParams(intersect: THREE.Intersection, position: THREE.Vector3): T;

  constructor(protected tool: AddBlockTool) {
    super();
    this.drawState = this.getDrawStateName();

    const position = new THREE.Vector3();

    this.cursor = new Cursor(tool.canvas, {
      mesh: tool.selectionBox.mesh,
      offset: [0, 0, 0],
      getInteractables: () => [
        this.tool.canvas.plane,
        this.tool.canvas.component.modelMesh,
        this.tool.canvas.component.fragmentMesh,
      ],
      hitTest: (intersect, meshPosition) => {
        Cursor.getDataPosition(meshPosition, position);
        return (
             position.x >= 0 && position.x < DESIGN_IMG_SIZE
          && position.y >= 0 && position.y < DESIGN_IMG_SIZE
          && position.z >= 0 && position.z < DESIGN_IMG_SIZE
        );
      },
      onMouseDown: params => this.handleMouseDown(params),
    });
  }

  handleMouseDown({ event, intersect }: CursorEventParams) {
    if (this.tool.props.fragment) this.tool.dispatchAction(voxelMergeFragment());

    const position = this.cursor.getPosition();
    if (position) this.transitionTo(this.drawState, this.getDrawStateParams(intersect, position));
  }

  onEnter() {
    this.tool.selectionBox.resize(1, 1, 1);
    this.cursor.start();
  }

  onLeave() {
    this.cursor.stop();
    this.tool.selectionBox.show(false);
  }
}

export default AddBlockTool;
export { AddBlockToolWaitState }
