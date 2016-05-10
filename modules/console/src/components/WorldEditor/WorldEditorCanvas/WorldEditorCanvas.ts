import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
const objectAssign = require('object-assign');
import DesignManager from '../../../DesignManager';
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
  require('three/examples/js/controls/MouseControls');
}

interface Position {
  x: number; y: number; z: number;
}

interface CameraBundle {
  camera: THREE.Camera;
  controls: any;
  setPosition(pos: Position): void;
  onUpdate(): void;
  onResize(): void;
}

class OrthographicCameraBundle implements CameraBundle {
  camera: THREE.OrthographicCamera;
  controls: any;

  constructor(private container: HTMLElement, renderer: THREE.WebGLRenderer) {
    // Init camera
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

    this.camera = camera;

    // Init controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
  	controls.mouseButtons = objectAssign({}, controls.mouseButtons, {
      ORBIT: THREE.MOUSE.RIGHT,
      PAN: THREE.MOUSE.LEFT,
    });
    controls.maxDistance = 2000;
    controls.enableKeys = false;
    controls.enableRotate = false;
    controls.enabled = true;

    this.controls = controls;
  }

  setPosition(pos: Position): void {
    this.controls.target.set(
      pos.x - PIXEL_UNIT,
      pos.y - PIXEL_UNIT,
      pos.z - PIXEL_UNIT
    );
  }

  onUpdate(): void {
    this.controls.update();
  }

  onResize(): void {
    this.camera.left = this.container.offsetWidth / - 2;
    this.camera.right = this.container.offsetWidth / 2;
    this.camera.top = this.container.offsetHeight / 2;
    this.camera.bottom = this.container.offsetHeight / - 2;
    this.camera.updateProjectionMatrix();
  }
}

class PerspectiveCameraBundle implements CameraBundle {
  camera: THREE.PerspectiveCamera;
  controls: any;

  constructor(private container: HTMLElement) {
    // Init camera
    const camera = new THREE.PerspectiveCamera(
      90,
      this.container.offsetWidth / this.container.offsetHeight,
      0.001,
      700
    );
    camera.position.set(0, 15, 0);
    this.camera = camera;

    // Init controls
    const controls = new THREE['MouseControls'](this.camera);
    this.controls = controls;
  }

  setPosition(pos: Position): void {}

  onUpdate(): void {
    this.controls.update();
  }

  onResize(): void {
    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
    this.camera.updateProjectionMatrix();
  }
}

class WorldEditorCanvas extends ZoneCanvas {
  cursorManager: CursorManager;
  removeListeners: Function;
  tool: WorldEditorCanvasTool;

  protected state: WorldEditorState;

  private controls: any;
  private cachedTools: { [index: string]: WorldEditorCanvasTool };
  private setCameraPositionImpl(pos: Position) {}

  private cameraBundle: CameraBundle;
  private orthographicCameraBundle: CameraBundle;
  private perspectiveCameraBundle: CameraBundle;

  private applyCameraMode(cameraMode: CameraMode) {
    switch(cameraMode) {
      case CameraMode.ORHTOGRAPHIC: {
        if (!this.orthographicCameraBundle) {
          this.orthographicCameraBundle = new OrthographicCameraBundle(this.container, this.renderer);
        }
        this.cameraBundle = this.orthographicCameraBundle;
        break;
      }
      case CameraMode.PERSPECTIVE: {
        if (!this.perspectiveCameraBundle) {
          this.perspectiveCameraBundle = new PerspectiveCameraBundle(this.container);
        }
        this.cameraBundle = this.perspectiveCameraBundle;
        break;
      }
    }

    if (this.cameraBundle) {
      this.cameraBundle.onResize();
      this.cameraBundle.onUpdate();
    }

    if (this.camera) {
      this.scene.remove(this.camera);
      this.camera = this.cameraBundle.camera;
      this.scene.add(this.camera);
    }
  }

  // Lazy getter
  getTool(toolType: ToolType): WorldEditorCanvasTool {
    const tool = this.cachedTools[toolType];
    if (tool) return tool;

    return this.cachedTools[toolType] = createTool(toolType, this.stateLayer, this, this.getGameState);
  }

  constructor(container: HTMLElement, designManager: DesignManager, stateLayer: StateLayer, private getGameState: GetState) {
    super(container, designManager, stateLayer, () => {
      const state = getGameState();
      return { playerId: state.playerId };
    });
  }

  init () {
    super.init();

    this.state = this.getGameState();

    this.cachedTools = {};
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
    this.applyCameraMode(this.getGameState().cameraMode);
    return this.cameraBundle.camera;
  }

  handleWindowResize() {
    this.cameraBundle.onResize();
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
  }

  render(dt = 0) {
    super.render(dt);
    this.cameraBundle.onUpdate();
    this.renderer.render(this.scene, this.camera);
  }

  onChange(gameState: WorldEditorState) {
    this.handleChange(gameState);
  }

  setCameraPosition(pos: Position) {
    super.setCameraPosition(pos);
    this.cameraBundle.setPosition(pos);
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

    if (this.state.mode !== nextState.mode) {
      switch(nextState.mode) {
        case EditorMode.EDIT: {
          this.applyCameraMode(CameraMode.ORHTOGRAPHIC);
          break;
        }
        case EditorMode.PLAY: {
          this.applyCameraMode(CameraMode.PERSPECTIVE);
          break;
        }
      }
      // this.controls.enabled = nextState.mode === EditorMode.EDIT;
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
