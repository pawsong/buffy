import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
const objectAssign = require('object-assign');
import DesignManager from '../../../canvas/DesignManager';
import ZoneCanvas from '../../../canvas/ZoneCanvas';

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
  CameraMode,
} from '../types';

import CursorManager from './CursorManager';
import createTool, { WorldEditorCanvasTool } from './tools';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/controls/OrbitControls');
  require('three/examples/js/controls/PointerLockControls');
}

import {
  View,
  OrthographicView,
  PerspectiveView,
} from './views';

interface Position {
  x: number; y: number; z: number;
}

class WorldEditorCanvas extends ZoneCanvas {
  cursorManager: CursorManager;
  removeListeners: Function;
  tool: WorldEditorCanvasTool;

  protected state: WorldEditorState;

  private controls: any;
  private cachedTools: { [index: string]: WorldEditorCanvasTool };

  private view: View;
  private cachedViews: { [index: string]: View };

  constructor(container: HTMLElement, designManager: DesignManager, stateLayer: StateLayer, private getGameState: GetState) {
    super(container, designManager, stateLayer, () => {
      const state = getGameState();
      return { playerId: state.playerId };
    });

    this.cachedTools = {};
    this.cachedViews = {};
  }

  private applyCameraMode(cameraMode: CameraMode) {
    let nextView: View;

    switch(cameraMode) {
      case CameraMode.ORHTOGRAPHIC: {
        if (!this.cachedViews[CameraMode.ORHTOGRAPHIC]) {
          this.cachedViews[CameraMode.ORHTOGRAPHIC] = new OrthographicView(this.container, this.renderer, this.scene);
        }
        nextView = this.cachedViews[CameraMode.ORHTOGRAPHIC];
        break;
      }
      case CameraMode.PERSPECTIVE: {
        if (!this.cachedViews[CameraMode.PERSPECTIVE]) {
          this.cachedViews[CameraMode.PERSPECTIVE] = new PerspectiveView(this.container, this.renderer, this.scene);
        }
        nextView = this.cachedViews[CameraMode.PERSPECTIVE]
        break;
      }
      default: {
        throw new Error(`Invalid camera mode: ${cameraMode}`);
      }
    }

    if (this.view) this.view.onLeave();

    this.view = nextView;
    this.camera = this.view.camera;

    this.view.onEnter();
    this.view.onResize();
    this.view.onUpdate();
  }

  // Lazy getter
  getTool(toolType: ToolType): WorldEditorCanvasTool {
    const tool = this.cachedTools[toolType];
    if (tool) return tool;

    return this.cachedTools[toolType] = createTool(toolType, this.stateLayer, this, this.getGameState);
  }

  init () {
    this.state = this.getGameState();

    super.init();

    this.cursorManager = new CursorManager(this);

    this.tool = this.getTool(this.state.selectedTool);
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

  initCamera(): THREE.Camera {
    this.applyCameraMode(this.state.cameraMode);
    return this.view.camera;
  }

  handleWindowResize() {
    this.view.onResize();
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
  }

  render(dt = 0) {
    super.render(dt);
    this.view.onUpdate();
    this.renderer.render(this.scene, this.camera);
  }

  onChange(gameState: WorldEditorState) {
    this.handleChange(gameState);
  }

  addCameraPosition(pos: Position) {
    this.view.addPosition(pos);
  }

  setCameraPosition(pos: Position) {
    this.view.setPosition(pos);
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

    if (this.state.cameraMode !== nextState.cameraMode) {
      this.applyCameraMode(nextState.cameraMode);
    }

    this.state = nextState;
  }

  destroy() {
    this.removeListeners();

    // Destroy views
    Object.keys(this.cachedViews).forEach(key => this.cachedViews[key].onDispose());

    // Destroy tools
    Object.keys(this.cachedTools).forEach(key => this.cachedTools[key].destroy());

    this.cursorManager.destroy();

    super.destroy();
  }
}

export default WorldEditorCanvas;
