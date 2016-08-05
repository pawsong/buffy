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
  voxelMergeFragment,
  moveMode2dPlane,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';

interface Mode2dToolProps {
  size: Position;
}

interface Mode2dToolTree {
  size: Position;
}

const AXIS_KEY = '__AXIS__';
const AXIS_UNIT_KEY = '__AXIS_UNIT__';

const OFFSET_KEY = '__OFFSET__';
const SCROLLBAR_KEY = '__SCROLLBAR__';

const ux = new THREE.Vector3(1, 0, 0);
const uy = new THREE.Vector3(0, 1, 0);
const uz = new THREE.Vector3(0, 0, 1);

const GUIDE_SCALE = 20;

class Mode2dTool extends ModelEditorTool<Mode2dToolProps, void, Mode2dToolTree> {
  getToolType(): ToolType { return ToolType.MODE2D; }

  scrollBars: THREE.Mesh[];
  scrollBarGuides: THREE.Mesh[];
  cursorMesh: THREE.Mesh;

  private temp1: THREE.Vector3;

  mapParamsToProps(params: ModelEditorState) {
    return {
      size: params.file.present.data.size,
    };
  }

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        size: { type: SchemaType.ANY },
      },
    };
  }

  render() {
    return {
      size: this.props.size,
    };
  }

  patch(diff: Mode2dToolTree) {
    if (diff.hasOwnProperty('size')) {
      this.resizeScrollBarWidth();
      this.updateScrollBarPosition();
    }
  }

  onInit(params: InitParams) {
    super.onInit(params);

    this.temp1 = new THREE.Vector3();

    const scrollGeometry = new THREE.PlaneGeometry(1, 1);
    const scrollbarMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });

    this.scrollBars = [];

    const x1 = new THREE.Mesh(scrollGeometry, scrollbarMaterial);
    x1.rotation.set(Math.PI / 2, Math.PI, 0);
    x1[AXIS_KEY] = Axis.X;
    x1[AXIS_UNIT_KEY] = ux;
    x1[OFFSET_KEY] = Axis.Z;
    this.scrollBars.push(x1);

    const x2 = new THREE.Mesh(scrollGeometry, scrollbarMaterial);
    x2.rotation.set(0, 0, 0);
    x2[AXIS_KEY] = Axis.X;
    x2[AXIS_UNIT_KEY] = ux;
    x2[OFFSET_KEY] = Axis.Y;
    this.scrollBars.push(x2);

    const y1 = new THREE.Mesh(scrollGeometry, scrollbarMaterial);
    y1.rotation.set(0, 0, Math.PI / 2);
    y1[AXIS_KEY] = Axis.Y;
    y1[AXIS_UNIT_KEY] = uy;
    y1[OFFSET_KEY] = Axis.X;
    this.scrollBars.push(y1);

    const y2 = new THREE.Mesh(scrollGeometry, scrollbarMaterial);
    y2.rotation.set(0, Math.PI / 2, Math.PI / 2);
    y2[AXIS_KEY] = Axis.Y;
    y2[AXIS_UNIT_KEY] = uy;
    y2[OFFSET_KEY] = Axis.Z;
    this.scrollBars.push(y2);

    const z1 = new THREE.Mesh(scrollGeometry, scrollbarMaterial);
    z1.rotation.set(Math.PI / 2, Math.PI / 2, Math.PI / 2);
    z1[AXIS_KEY] = Axis.Z;
    z1[AXIS_UNIT_KEY] = uz;
    z1[OFFSET_KEY] = Axis.Y;
    this.scrollBars.push(z1);

    const z2 = new THREE.Mesh(scrollGeometry, scrollbarMaterial);
    z2.rotation.set(Math.PI / 2, Math.PI, Math.PI / 2);
    z2[AXIS_KEY] = Axis.Z;
    z2[AXIS_UNIT_KEY] = uz;
    z2[OFFSET_KEY] = Axis.X;
    this.scrollBars.push(z2);

    this.scrollBars.forEach(mesh => mesh.renderOrder = - 5);

    this.scrollBarGuides = this.scrollBars.map(scrollbar => {
      const guide = scrollbar.clone();
      guide[SCROLLBAR_KEY] = scrollbar;

      // // For debugging
      // guide.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      // this.canvas.scene.add(guide);

      return guide;
    });

    const cursorGeometry = new THREE.PlaneGeometry(PIXEL_SCALE, 1);
    const cursorMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });
    this.cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);
  }

  /*
   * Must be called after changing scrollbar width / height
   */
  updateScrollBarPosition() {
    this.canvas.camera.getWorldDirection(this.temp1);
    const direction: Position = [this.temp1.x, this.temp1.y, this.temp1.z];
    this._updateScrollBarPosition(this.scrollBars, direction);
    this._updateScrollBarPosition(this.scrollBarGuides, direction);
    this.scrollBarGuides.forEach(guide => guide.updateMatrixWorld(false));
  }

  _updateScrollBarPosition(scrollBars: THREE.Mesh[], direction: Position) {
    const { size } = this.props;

    for (let d = 0; d < 3; ++d) {
      const i = 2 * d;

      const u = (d + 1) % 3;
      const v = (d + 2) % 3;
      const rad = Math.atan2(direction[v], direction[u]);

      if (rad > 0) {
        if (rad > Math.PI / 2) {
          scrollBars[i  ].position.setComponent(u, 0);
          scrollBars[i  ].position.setComponent(v, - scrollBars[i].scale.y / 2);
          scrollBars[i+1].position.setComponent(u, size[u] * PIXEL_SCALE + scrollBars[i+1].scale.y / 2);
          scrollBars[i+1].position.setComponent(v, size[v] * PIXEL_SCALE);
        } else {
          scrollBars[i  ].position.setComponent(u, size[u] * PIXEL_SCALE);
          scrollBars[i  ].position.setComponent(v, - scrollBars[i].scale.y / 2);
          scrollBars[i+1].position.setComponent(u, - scrollBars[i+1].scale.y / 2);
          scrollBars[i+1].position.setComponent(v, size[v] * PIXEL_SCALE);
        }
      } else {
        if (rad <= - Math.PI / 2) {
          scrollBars[i  ].position.setComponent(u, 0);
          scrollBars[i  ].position.setComponent(v, size[v] * PIXEL_SCALE + scrollBars[i].scale.y / 2);
          scrollBars[i+1].position.setComponent(u, size[u] * PIXEL_SCALE + scrollBars[i+1].scale.y / 2);
          scrollBars[i+1].position.setComponent(v, 0);
        } else {
          scrollBars[i  ].position.setComponent(u, size[u] * PIXEL_SCALE);
          scrollBars[i  ].position.setComponent(v, size[v] * PIXEL_SCALE + scrollBars[i].scale.y / 2);
          scrollBars[i+1].position.setComponent(u, - scrollBars[i+1].scale.y / 2);
          scrollBars[i+1].position.setComponent(v, 0);
        }
      }
    }
  }

  private resizeScrollBarWidth() {
    this._resizeScrollBarWidth(this.scrollBars);
    this._resizeScrollBarWidth(this.scrollBarGuides);
  }

  private _resizeScrollBarWidth(scrollBars: THREE.Mesh[]) {
    const { size } = this.props;

    for (let d = 0; d < 3; ++d) {
      const i = 2 * d;
      scrollBars[i  ].scale.setX(size[d] * PIXEL_SCALE);
      scrollBars[i  ].position.setComponent(d, size[d] * PIXEL_SCALE_HALF);
      scrollBars[i+1].scale.setX(size[d] * PIXEL_SCALE);
      scrollBars[i+1].position.setComponent(d, size[d] * PIXEL_SCALE_HALF);
    }
  }

  private resizeScrollbarHeight() {
    const scale = this.getScaleForCamera();
    this._resizeScrollbarHeight(this.scrollBars, scale);
    this._resizeScrollbarHeight(this.scrollBarGuides, scale * GUIDE_SCALE);

    this.cursorMesh.scale.setY(scale);
    this.cursorMesh.visible = false;
  }

  private _resizeScrollbarHeight(scrollBars: THREE.Mesh[], scale) {
    scrollBars.forEach(mesh => mesh.scale.setY(scale));
  }

  onCameraMove() {
    this.resizeScrollbarHeight();
    this.updateScrollBarPosition();
  }

  private getScaleForCamera() {
    return 30 / this.canvas.camera.zoom;
  }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAG]: new DragState(this),
    };
  }

  onStart() {
    this.canvas.scene.add(this.cursorMesh);
    this.scrollBars.forEach(mesh => this.canvas.scene.add(mesh));
    this.resizeScrollBarWidth();
    this.resizeScrollbarHeight();
    this.updateScrollBarPosition();
  }

  onStop() {
    this.canvas.scene.remove(this.cursorMesh);
    this.scrollBars.forEach(mesh => this.canvas.scene.remove(mesh));
  }

  updateCursorOnHit(scrollBar: THREE.Object3D, normal: THREE.Vector3, position: THREE.Vector3) {
    this.cursorMesh.rotation.copy(scrollBar.rotation);

    this.temp1.set(
      normal.x !== 0 ? 0 : PIXEL_SCALE_HALF,
      normal.y !== 0 ? 0 : PIXEL_SCALE_HALF,
      normal.z !== 0 ? 0 : PIXEL_SCALE_HALF
    );

    this.cursorMesh.position.add(this.temp1);

    const i = scrollBar[OFFSET_KEY];
    this.cursorMesh.position.setComponent(i, scrollBar.position.getComponent(i));
  }

  onDestroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: Mode2dTool) {
    super();

    const meshOffset = new THREE.Vector3();
    this.cursor = new Cursor(tool.canvas, {
      mesh: tool.cursorMesh,
      interactablesAreRotated: true,
      getInteractables: () => this.tool.scrollBars,
      onHit: params => tool.updateCursorOnHit(params.intersect.object, params.normal, this.cursor.getPosition()),
      onMouseDown: this.handleMouseDown,
    });
  }

  onEnter(event?: MouseEvent) {
    this.cursor.start(event);
  }

  handleMouseDown = (params: CursorEventParams) => {
    if (params.intersect) {
      this.transitionTo(STATE_DRAG, <EnterParams>{
        scrollbar: params.intersect.object,
        event: params.event,
      });
    }
  }

  onLeave() {
    this.cursor.stop();
  }
}

interface EnterParams {
  scrollbar: THREE.Object3D;
  event: MouseEvent;
}

class DragState extends ToolState {
  cursor: Cursor;
  axis: Axis;
  position: number;

  constructor(private tool: Mode2dTool) {
    super();

    const meshOffset = new THREE.Vector3();
    this.cursor = new Cursor(tool.canvas, {
      mesh: tool.cursorMesh,
      interactablesAreRotated: true,
      getInteractables: () => this.tool.scrollBarGuides,
      onHit: this.handleHit,
      onMouseUp: this.handleMouseUp,
    });
  }

  updatePlane(scrollbar: THREE.Object3D, position: THREE.Vector3) {
    this.axis = scrollbar[AXIS_KEY];
    this.position = position.dot(scrollbar[AXIS_UNIT_KEY]);
    this.tool.canvas.component.moveMode2dClippingPlane(this.axis, this.position);
  }

  onEnter(params: EnterParams) {
    this.tool.canvas.tool.pause();
    this.cursor.start(params.event);

    const position = this.cursor.getPosition();
    this.updatePlane(params.scrollbar, position);
  }

  handleHit = (params: CursorEventParams) => {
    const position = this.cursor.getPosition();
    const scrollbar = params.intersect.object[SCROLLBAR_KEY];
    this.tool.updateCursorOnHit(scrollbar, params.normal, position);

    // Update temporary states
    this.updatePlane(scrollbar, position);
  }

  handleMouseUp = ({ event }: CursorEventParams) => {
    this.tool.dispatchAction(moveMode2dPlane(this.axis, this.position));
    this.transitionTo(STATE_WAIT, event);
  }

  onLeave() {
    this.cursor.stop();
    this.tool.canvas.tool.resume();
  }
}

export default Mode2dTool;
