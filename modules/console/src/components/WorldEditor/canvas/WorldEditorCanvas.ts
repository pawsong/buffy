import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
const objectAssign = require('object-assign');
import DesignManager from '../../../canvas/DesignManager';
import ZoneCanvas from '../../../canvas/ZoneCanvas';
import Fsm from '../../../libs/Fsm';
import {
  SourceFileDB,
} from '../../Studio/types';

import {
  Events as ModeEvents,
  EditModeState,
  PlayModeState,
} from './modes';

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
  EditorMode,
  CameraMode,
} from '../types';

import CursorManager from './CursorManager';

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

interface WorldEditorCanvasOptions {
  container: HTMLElement;
  designManager: DesignManager;
  stateLayer: StateLayer;
  getState: GetState;
  getFiles: () => SourceFileDB;
}

/*
 * WorldEditorCanvas can be connected to following data sources:
 *   - file (in edit mode)
 *   - stateLayer (in play mode)
 */
class WorldEditorCanvas extends ZoneCanvas {
  cursorManager: CursorManager;
  removeListeners: Function;

  // Mode fsm & states
  editModeState: EditModeState;
  playModeState: PlayModeState;
  modeFsm: Fsm;

  protected state: WorldEditorState;

  private view: View;
  private cachedViews: { [index: string]: View };

  private stateLayer: StateLayer;
  private getGameState: GetState;
  private getFiles: () => SourceFileDB;

  constructor({
    container,
    designManager,
    stateLayer,
    getState,
    getFiles,
  }: WorldEditorCanvasOptions) {
    super(container, designManager, () => {
      const state = getState();
      return { playerId: state.playerId };
    });

    this.cachedViews = {};
    this.stateLayer = stateLayer;
    this.getGameState = getState;
    this.getFiles = getFiles;
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

  init () {
    this.state = this.getGameState();

    super.init();

    this.cursorManager = new CursorManager(this);

    const onDocumentMouseUp = (event: MouseEvent) => {
      event.preventDefault();
      this.modeFsm.trigger(ModeEvents.MOUSE_UP, event);
    };

    const onDocumentMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      this.modeFsm.trigger(ModeEvents.MOUSE_DOWN, event);
    };

    // Add event handlers
    this.renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    this.renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);

    this.removeListeners = () => {
      if (!this.renderer.domElement) return;
      this.renderer.domElement.removeEventListener('mousedown', onDocumentMouseDown, false);
      this.renderer.domElement.removeEventListener('mouseup', onDocumentMouseUp, false);
    };

    // Initialize modes
    this.editModeState = new EditModeState(this.getGameState, {
      view: this,
    }, this.getFiles);
    this.editModeState.init();

    this.playModeState = new PlayModeState(this.getGameState, {
      view: this,
      stateLayer: this.stateLayer,
    }, this.getFiles);
    this.playModeState.init();

    this.modeFsm = new Fsm({
      [EditorMode[EditorMode.EDIT]]: this.editModeState,
      [EditorMode[EditorMode.PLAY]]: this.playModeState,
    }, EditorMode[this.state.mode]);
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
    if (this.state.mode !== nextState.mode) {
      this.modeFsm.trigger(ModeEvents.CHANGE_MODE, nextState.mode);
    }

    this.modeFsm.trigger(ModeEvents.CHANGE_STATE, nextState);

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
    this.editModeState.destroy();
    this.playModeState.destroy();

    this.removeListeners();

    // Destroy views
    Object.keys(this.cachedViews).forEach(key => this.cachedViews[key].onDispose());

    this.cursorManager.destroy();

    super.destroy();
  }
}

export default WorldEditorCanvas;
