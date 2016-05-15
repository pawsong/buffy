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
  CHANGE_EDITOR_MODE, ChangeEditorModeAction,
} from '../actions';

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
  Action,
  WorldEditorState,
  DispatchAction,
  GetState,
  EditorMode,
  ViewMode,
  ActionListener,
  SubscribeAction,
  UnsubscribeAction,
} from '../types';

import CursorManager from './CursorManager';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/controls/OrbitControls');
  require('three/examples/js/controls/PointerLockControls');
}

import {
  View,
  FirstPersonView,
  BirdsEyeView,
} from './views';

interface Position {
  x: number; y: number; z: number;
}

interface WorldEditorCanvasOptions {
  container: HTMLElement;
  designManager: DesignManager;
  stateLayer: StateLayer;
  getState: GetState;
  dispatchAction: DispatchAction;
  subscribeAction: SubscribeAction;
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
  private dispatchAction: DispatchAction;
  private getFiles: () => SourceFileDB;

  private subscribeAction: SubscribeAction;
  private unsubscribeAction: UnsubscribeAction;

  constructor({
    container,
    designManager,
    stateLayer,
    getState,
    dispatchAction,
    subscribeAction,
    getFiles,
  }: WorldEditorCanvasOptions) {
    super(container, designManager, () => {
      const state = getState();
      return { playerId: state.editMode.playerId };
    });

    this.cachedViews = {};
    this.stateLayer = stateLayer;
    this.getGameState = getState;
    this.getFiles = getFiles;
    this.dispatchAction = dispatchAction;
    this.subscribeAction = subscribeAction;
  }

  applyCameraMode(viewMode: ViewMode) {
    let nextView: View;

    switch(viewMode) {
      case ViewMode.BIRDS_EYE: {
        if (!this.cachedViews[ViewMode.BIRDS_EYE]) {
          this.cachedViews[ViewMode.BIRDS_EYE] = new BirdsEyeView(this.container, this.renderer, this.scene);
        }
        nextView = this.cachedViews[ViewMode.BIRDS_EYE];
        break;
      }
      case ViewMode.FIRST_PERSON: {
        if (!this.cachedViews[ViewMode.FIRST_PERSON]) {
          this.cachedViews[ViewMode.FIRST_PERSON] = new FirstPersonView(this.container, this.renderer, this.scene);
        }
        nextView = this.cachedViews[ViewMode.FIRST_PERSON]
        break;
      }
      default: {
        throw new Error(`Invalid camera mode: ${viewMode}`);
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
      getState: this.getGameState,
      getFiles: this.getFiles,
      dispatchAction: this.dispatchAction,
      designManager: this.designManager,
    }, this.getFiles, this.subscribeAction);
    this.editModeState.init();

    this.playModeState = new PlayModeState(this.getGameState, {
      view: this,
      stateLayer: this.stateLayer,
    }, this.getFiles, this.subscribeAction);
    this.playModeState.init();

    this.modeFsm = new Fsm({
      [EditorMode[EditorMode.EDIT]]: this.editModeState,
      [EditorMode[EditorMode.PLAY]]: this.playModeState,
    }, EditorMode[this.state.editMode.tool]);

    this.unsubscribeAction = this.subscribeAction(action => this.handleActionDispatch(action));
  }

  handleActionDispatch(action: Action<any>) {
    switch(action.type) {
      case CHANGE_EDITOR_MODE: {
        const { mode } = <ChangeEditorModeAction>action;
        this.modeFsm.trigger(ModeEvents.CHANGE_MODE, mode);
        return;
      }
    }
  }

  initCamera(): THREE.Camera {
    this.applyCameraMode(this.state.playMode.viewMode);
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

  handleChange(state: WorldEditorState) {
    this.modeFsm.trigger(ModeEvents.CHANGE_STATE, state);

    // if (this.state.editMode.playerId !== nextState.editMode.playerId) {
    //   const object = this.objectManager.objects[nextState.editMode.playerId];
    //   this.setCameraPosition(object.group.position);
    // }

    // if (this.state.playMode.viewMode !== nextState.playMode.viewMode) {
    //   this.applyCameraMode(nextState.playMode.viewMode);
    // }

    this.state = state;
  }

  destroy() {
    this.unsubscribeAction();

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
