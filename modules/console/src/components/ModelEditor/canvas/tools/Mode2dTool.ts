import THREE from 'three';
import Immutable from 'immutable';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';

import CursorState from './states/CursorState';
import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';
import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  Position,
  ToolType,
  ModelEditorState,
  Axis,
} from '../../types';

import {
  voxelMaginWand,
  voxelClearSelection,
  voxelMergeFragment,
  moveMode2DPlane,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'draw';

interface Mode2dToolProps {
  size: Position;
  mode2D: {
    enabled: boolean;
    axis: Axis;
    position: number;
  };
}

interface Mode2dToolTree {
  size: Position;
  mode2D: {
    enabled: boolean;
    axis: Axis;
    position: number;
  };
}

const AXIS_KEY = '__AXIS__';
const AXIS_UNIT_KEY = '__AXIS_UNIT__';
const ux = new THREE.Vector3(1, 0, 0);
const uy = new THREE.Vector3(0, 1, 0);
const uz = new THREE.Vector3(0, 0, 1);

class Mode2dTool extends ModelEditorTool<Mode2dToolProps, void, Mode2dToolTree> {
  getToolType(): ToolType { return ToolType.MAGIC_WAND_2D; }

  mode2DScrollBars: THREE.Mesh[];
  mode2DCursorMesh: THREE.Mesh;

  // mode2DPlane: THREE.Mesh;

  private temp1: THREE.Vector3;

  mapParamsToProps(params: ModelEditorState) {
    return {
      size: params.file.present.data.size,
      mode2D: params.file.present.data.mode2D,
    };
  }

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        size: { type: SchemaType.ANY },
        mode2D: { type: SchemaType.ANY },
      },
    };
  }

  render() {
    console.log(this.props);
    return {
      size: this.props.size,
      mode2D: this.props.mode2D,
    };
  }

  patch(diff: Mode2dToolTree) {
    if (diff.hasOwnProperty('size')) {
      this.resizeMode2DScrollBars();
      // this.updatePlane(this.tree.mode2D.axis, this.tree.mode2D.position);
    }

    if (diff.hasOwnProperty('mode2D')) {
      // this.updatePlane(this.tree.mode2D.axis, this.tree.mode2D.position);
    }
  }

  onInit(params: InitParams) {
    super.onInit(params);

    this.temp1 = new THREE.Vector3();

    const scrollGeometry = new THREE.PlaneGeometry(1, PIXEL_SCALE);
    const scrollbarMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });

    this.mode2DScrollBars = [];
    const z1 = new THREE.Mesh(scrollGeometry, scrollbarMaterial);
    z1.rotation.set(Math.PI / 2, Math.PI, Math.PI / 2);
    z1[AXIS_KEY] = Axis.Z;
    z1[AXIS_UNIT_KEY] = uz;
    this.mode2DScrollBars.push(z1);

    const x1 = new THREE.Mesh(scrollGeometry, scrollbarMaterial);
    x1.rotation.set(Math.PI / 2, Math.PI, 0);
    x1[AXIS_KEY] = Axis.X;
    x1[AXIS_UNIT_KEY] = ux;
    this.mode2DScrollBars.push(x1);

    const y1 = new THREE.Mesh(scrollGeometry, scrollbarMaterial);
    y1.rotation.set(0, 0, Math.PI / 2);
    y1[AXIS_KEY] = Axis.Y;
    y1[AXIS_UNIT_KEY] = uy;
    this.mode2DScrollBars.push(y1);

    const y2 = new THREE.Mesh(scrollGeometry, scrollbarMaterial);
    y2.rotation.set(0, Math.PI / 2, Math.PI / 2);
    y2[AXIS_KEY] = Axis.Y;
    y2[AXIS_UNIT_KEY] = uy;
    this.mode2DScrollBars.push(y2);

    const cursorGeometry = new THREE.PlaneGeometry(PIXEL_SCALE, PIXEL_SCALE);
    const cursorMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });
    this.mode2DCursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);

    const planeGeometry = new THREE.PlaneGeometry(PIXEL_SCALE, PIXEL_SCALE);
    const planeMaterial = new THREE.MeshBasicMaterial({
      // color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })
    // this.mode2DPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  }

  // updatePlane(axis: Axis, position: number) {
  //   switch(axis) {
  //     case Axis.X: {
  //       this.mode2DPlane.rotation.set(0, Math.PI / 2, Math.PI / 2);
  //       this.mode2DPlane.scale.set(this.props.size[1], this.props.size[2], 1);
  //       this.mode2DPlane.position.set(
  //         position * PIXEL_SCALE,
  //         this.props.size[1] / 2 * PIXEL_SCALE,
  //         this.props.size[2] / 2 * PIXEL_SCALE
  //       );
  //       return;
  //     }
  //     case Axis.Y: {
  //       this.mode2DPlane.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  //       this.mode2DPlane.scale.set(this.props.size[2], this.props.size[0], 1);
  //       this.mode2DPlane.position.set(
  //         this.props.size[0] / 2 * PIXEL_SCALE,
  //         position * PIXEL_SCALE,
  //         this.props.size[2] / 2 * PIXEL_SCALE
  //       );
  //       return;
  //     }
  //     case Axis.Z: {
  //       this.mode2DPlane.rotation.set(0, 0, 0);
  //       this.mode2DPlane.scale.set(this.props.size[0], this.props.size[1], 1);
  //       this.mode2DPlane.position.set(
  //         this.props.size[0] / 2 * PIXEL_SCALE,
  //         this.props.size[1] / 2 * PIXEL_SCALE,
  //         position * PIXEL_SCALE
  //       );
  //       return;
  //     }
  //   }
  // }

  resizeMode2DScrollBars() {
    const { size } = this.props;

    // Z
    this.mode2DScrollBars[0].scale.setX(size[2] * PIXEL_SCALE);
    this.mode2DScrollBars[0].position.setZ(size[2] * PIXEL_SCALE / 2);

    // X
    this.mode2DScrollBars[1].scale.setX(size[0] * PIXEL_SCALE);
    this.mode2DScrollBars[1].position.setX(size[0] * PIXEL_SCALE / 2);

    // Y
    this.mode2DScrollBars[2].scale.setX(size[1] * PIXEL_SCALE);
    this.mode2DScrollBars[2].position.setY(size[1] * PIXEL_SCALE / 2);
    this.mode2DScrollBars[3].scale.setX(size[1] * PIXEL_SCALE);
    this.mode2DScrollBars[3].position.setY(size[1] * PIXEL_SCALE / 2);

    this.updateModel2DScrollBars();
  }

  updateModel2DScrollBars() {
    this.canvas.camera.getWorldDirection(this.temp1);
    const direction = [this.temp1.x, this.temp1.y, this.temp1.z];

    const { size } = this.props;

    if (direction[2] > 0) {
      this.mode2DScrollBars[1].position.setZ(- PIXEL_SCALE_HALF);
    } else {
      this.mode2DScrollBars[1].position.setZ(size[2] * PIXEL_SCALE + PIXEL_SCALE_HALF);
    }

    if (direction[0] > 0) {
      this.mode2DScrollBars[0].position.setX(- PIXEL_SCALE_HALF);
    } else {
      this.mode2DScrollBars[0].position.setX(size[0] * PIXEL_SCALE + PIXEL_SCALE_HALF);
    }

    if (direction[1] > 0) {
      this.mode2DScrollBars[0].position.setY(size[1] * PIXEL_SCALE);
      this.mode2DScrollBars[1].position.setY(size[1] * PIXEL_SCALE);
    } else {
      this.mode2DScrollBars[0].position.setY(0);
      this.mode2DScrollBars[1].position.setY(0);
    }

    const rad = Math.atan2(direction[0], direction[2]);
    if (rad > 0) {
      if (rad > Math.PI / 2) {
        if (rad > Math.PI * 3 / 4) {
          this.mode2DScrollBars[2].visible = true;
          this.mode2DScrollBars[3].visible = false;
          this.mode2DScrollBars[2].position.setZ(0);
          this.mode2DScrollBars[2].position.setX(- PIXEL_SCALE_HALF);
        } else {
          this.mode2DScrollBars[2].visible = false;
          this.mode2DScrollBars[3].visible = true;
          this.mode2DScrollBars[3].position.setZ(size[2] * PIXEL_SCALE + PIXEL_SCALE_HALF);
          this.mode2DScrollBars[3].position.setX(size[0] * PIXEL_SCALE);
        }
      } else {
        if (rad > Math.PI / 4) {
          this.mode2DScrollBars[2].visible = false;
          this.mode2DScrollBars[3].visible = true;
          this.mode2DScrollBars[3].position.setZ(- PIXEL_SCALE_HALF);
          this.mode2DScrollBars[3].position.setX(size[0] * PIXEL_SCALE);
        } else {
          this.mode2DScrollBars[2].visible = true;
          this.mode2DScrollBars[3].visible = false;
          this.mode2DScrollBars[2].position.setZ(size[2] * PIXEL_SCALE);
          this.mode2DScrollBars[2].position.setX(- PIXEL_SCALE_HALF);
        }
      }
    } else {
      if (rad <= - Math.PI / 2) {
        if (rad <= - Math.PI * 3 / 4) {
          this.mode2DScrollBars[2].visible = true;
          this.mode2DScrollBars[3].visible = false;
          this.mode2DScrollBars[2].position.setZ(0);
          this.mode2DScrollBars[2].position.setX(size[0] * PIXEL_SCALE + PIXEL_SCALE_HALF);
        } else {
          this.mode2DScrollBars[2].visible = false;
          this.mode2DScrollBars[3].visible = true;
          this.mode2DScrollBars[3].position.setZ(size[2] * PIXEL_SCALE + PIXEL_SCALE_HALF);
          this.mode2DScrollBars[3].position.setX(0);
        }
      } else {
        if (rad <= - Math.PI / 4) {
          this.mode2DScrollBars[2].visible = false;
          this.mode2DScrollBars[3].visible = true;
          this.mode2DScrollBars[3].position.setZ(- PIXEL_SCALE_HALF);
          this.mode2DScrollBars[3].position.setX(0);
        } else {
          this.mode2DScrollBars[2].visible = true;
          this.mode2DScrollBars[3].visible = false;
          this.mode2DScrollBars[2].position.setZ(size[2] * PIXEL_SCALE);
          this.mode2DScrollBars[2].position.setX(size[0] * PIXEL_SCALE + PIXEL_SCALE_HALF);
        }
      }
    }
  }

  onCameraMove() {
    this.updateModel2DScrollBars();
  }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAG]: new DragState(this),
    };
  }

  onStart() {
    this.canvas.scene.add(this.mode2DCursorMesh);
    // this.canvas.scene.add(this.mode2DPlane);
    this.mode2DScrollBars.forEach(mesh => this.canvas.scene.add(mesh));
    this.resizeMode2DScrollBars();
  }

  onStop() {
    this.canvas.scene.remove(this.mode2DCursorMesh);
    // this.canvas.scene.remove(this.mode2DPlane);
    this.mode2DScrollBars.forEach(mesh => this.canvas.scene.remove(mesh));
  }

  onDestroy() {

  }

  updateCursorOnHit(params: CursorEventParams, position: THREE.Vector3) {
    this.mode2DCursorMesh.rotation.copy(params.intersect.object.rotation);

    this.temp1.set(
      params.normal.x !== 0 ? 0 : position.x === 0 ? PIXEL_SCALE_HALF : PIXEL_SCALE_HALF,
      params.normal.y !== 0 ? 0 : position.y === 0 ? PIXEL_SCALE_HALF : PIXEL_SCALE_HALF,
      params.normal.z !== 0 ? 0 : position.z === 0 ? PIXEL_SCALE_HALF : PIXEL_SCALE_HALF
    );

    this.mode2DCursorMesh.position.add(this.temp1);
  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: Mode2dTool) {
    super();

    const meshOffset = new THREE.Vector3();
    this.cursor = new Cursor(tool.canvas, {
      mesh: tool.mode2DCursorMesh,
      interactablesAreRotated: true,
      getInteractables: () => this.tool.mode2DScrollBars,
      onHit: params => tool.updateCursorOnHit(params, this.cursor.getPosition()),
      onMouseDown: this.handleMouseDown,
    });
  }

  onEnter(event?: MouseEvent) {
    this.cursor.start(event);
  }

  handleMouseDown = (params: CursorEventParams) => {
    if (params.intersect) {
      this.transitionTo(STATE_DRAG, params);
    }
  }

  onLeave() {
    this.cursor.stop();
  }
}

class DragState extends ToolState {
  cursor: Cursor;
  axis: Axis;
  position: number;

  constructor(private tool: Mode2dTool) {
    super();

    const meshOffset = new THREE.Vector3();
    this.cursor = new Cursor(tool.canvas, {
      mesh: tool.mode2DCursorMesh,
      interactablesAreRotated: true,
      getInteractables: () => this.tool.mode2DScrollBars,
      onHit: this.handleHit,
      onMouseUp: this.handleMouseUp,
    });
  }

  update(scrollbar: THREE.Object3D, position: THREE.Vector3) {
    this.axis = scrollbar[AXIS_KEY];
    this.position = position.dot(scrollbar[AXIS_UNIT_KEY]);
    this.tool.canvas.component.moveMode2DClippingPlane(this.axis, this.position);
  }

  onEnter(params: CursorEventParams) {
    this.tool.canvas.tool.pause();
    this.cursor.start(params.event);

    const position = this.cursor.getPosition();
    this.update(params.intersect.object, position);
  }

  handleHit = (params: CursorEventParams) => {
    const position = this.cursor.getPosition();
    this.tool.updateCursorOnHit(params, position);

    // Update temporary states
    this.update(params.intersect.object, position);
  }

  handleMouseUp = ({ event }: CursorEventParams) => {
    this.tool.dispatchAction(moveMode2DPlane(this.axis, this.position));
    this.transitionTo(STATE_WAIT, event);
  }

  onLeave() {
    this.cursor.stop();
    this.tool.canvas.tool.resume();
  }
}

export default Mode2dTool;
