import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
const objectAssign = require('object-assign');
import DesignManager from '../../../DesignManager';
import ZoneView from '../../../ZoneView';

import {
  PIXEL_NUM,
  PIXEL_UNIT,
  BOX_SIZE,
  MINI_PIXEL_SIZE,
  GRID_SIZE,
} from '../Constants';

import {
  WorldEditorState,
  GetState,
  ToolType,
  EditorMode,
} from '../types';

import CursorManager from './CursorManager';
import createTool, { WorldEditorCanvasTool } from './tools';

interface Position {
  x: number; y: number; z: number;
}

class WorldEditorCanvas extends ZoneView {
  camera: THREE.OrthographicCamera;
  cursorManager: CursorManager;
  removeListeners: Function;
  tool: WorldEditorCanvasTool;

  protected stateLayer: StateLayer;
  protected state: WorldEditorState;

  private controls: any;
  private cachedTools: { [index: string]: WorldEditorCanvasTool };
  private setCameraPositionImpl(pos: Position) {}

  // Lazy getter
  getTool(toolType: ToolType): WorldEditorCanvasTool {
    const tool = this.cachedTools[toolType];
    if (tool) return tool;

    return this.cachedTools[toolType] = createTool(toolType, this.stateLayer, this, this.getGameState);
  }

  constructor(container: HTMLElement, stateLayer: StateLayer, designManager: DesignManager, private getGameState: GetState) {
    super(container, stateLayer, designManager, () => {
      const state = getGameState();
      return { playerId: state.playerId };
    });

    this.state = getGameState();

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
  	this.controls.mouseButtons = objectAssign({}, this.controls.mouseButtons, {
      ORBIT: THREE.MOUSE.RIGHT,
      PAN: THREE.MOUSE.LEFT,
    });
    this.controls.maxDistance = 2000;
    this.controls.enableKeys = false;
    this.controls.enableRotate = false;
    this.controls.enabled = this.state.mode === EditorMode.EDIT;

    this.stateLayer = stateLayer;

    this.cachedTools = {};

    const raycaster = new THREE.Raycaster();
    this.cursorManager = new CursorManager(container, this.scene, raycaster, this.camera, this.terrainManager);

    this.tool = this.getTool(getGameState().selectedTool);
    this.tool.onStart();

    const onDocumentMouseUp = (event: MouseEvent) => {
      event.preventDefault();
      this.tool.onMouseUp({ event });
    };

    const onDocumentMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      this.tool.onMouseDown({ event });
    };

    // Add event handlers
    this.renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    this.renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);

    this.removeListeners = () => {
      if (!this.renderer.domElement) return;
      this.renderer.domElement.removeEventListener('mousedown', onDocumentMouseDown, false);
      this.renderer.domElement.removeEventListener('mouseup', onDocumentMouseUp, false);
    };

    this.setCameraPositionImpl = this.setCameraPositionInIsometricView;
  }

  private setCameraPositionInIsometricView = (pos) => {
    this.controls.target.set(
      pos.x - PIXEL_UNIT,
      pos.y - PIXEL_UNIT,
      pos.z - PIXEL_UNIT
    );
  }

  getCamera() {
    const camera = new THREE.OrthographicCamera(
      this.container.offsetWidth / - 2,
      this.container.offsetWidth / 2,
      this.container.offsetHeight / 2,
      this.container.offsetHeight / - 2,
      - GRID_SIZE, 2 * GRID_SIZE
    );
    camera.position.x = 200;
    camera.position.y = 200;
    camera.position.z = 200;

    return camera;
  }

  handleWindowResize() {
    this.camera.left = this.container.offsetWidth / - 2;
    this.camera.right = this.container.offsetWidth / 2;
    this.camera.top = this.container.offsetHeight / 2;
    this.camera.bottom = this.container.offsetHeight / - 2;
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
  }

  render(dt = 0) {
    super.render(dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onChange(gameState: WorldEditorState) {
    this.handleChange(gameState);
  }

  setCameraPosition(pos: Position) {
    super.setCameraPosition(pos);
    this.setCameraPositionImpl(pos);
  }

  handleChange(nextState: WorldEditorState) {
    if (this.tool.getToolType() !== nextState.selectedTool) {
      const nextTool = this.getTool(nextState.selectedTool);
      this.tool.onStop();
      this.tool = nextTool;
      this.tool.onStart();
    }

    this.tool.updateProps(nextState);

    if (this.state.playerId !== nextState.playerId) {
      const object = this.objectManager.objects[nextState.playerId];
      this.setCameraPosition(object.group.position);
    }

    // if (this.state.mode !== nextState.mode) {
    //   this.controls.enabled = nextState.mode === EditorMode.EDIT;
    // }

    this.state = nextState;
  }

  destroy() {
    super.destroy();
    this.removeListeners();

    // Destroy tools
    Object.keys(this.cachedTools).forEach(toolType => this.cachedTools[toolType].destroy());

    this.cursorManager.destroy();
  }
}

export default WorldEditorCanvas;
