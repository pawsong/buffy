import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
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
} from '../types';

import CursorManager from './CursorManager';
import createTool, { WorldEditorCanvasTool } from './tools';

class WorldEditorCanvas extends ZoneView {
  stateLayer: StateLayer;
  state: WorldEditorState;

  camera: THREE.OrthographicCamera;
  cursorManager: CursorManager;
  removeListeners: Function;

  tool: WorldEditorCanvasTool;

  private cachedTools: { [index: string]: WorldEditorCanvasTool };

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
    this.stateLayer = stateLayer;
    this.state = getGameState();

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
    this.renderer.render(this.scene, this.camera);
  }

  onChange(gameState: WorldEditorState) {
    this.handleChange(gameState);
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
      this.camera.position.copy(object.group.position);
    }

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
