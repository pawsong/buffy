import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
const objectAssign = require('object-assign');
import ModelManager from '../../../canvas/ModelManager';
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

import CursorManager from '../../../canvas/CursorManager';

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
  modelManager: ModelManager;
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

  advertisingBoards: THREE.Mesh[];

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
    modelManager,
    stateLayer,
    getState,
    dispatchAction,
    subscribeAction,
    getFiles,
  }: WorldEditorCanvasOptions) {
    super(container, modelManager, () => {
      const state = getState();
      return { playerId: state.editMode.playerId };
    });

    this.cachedViews = {};
    this.stateLayer = stateLayer;
    this.getGameState = getState;
    this.getFiles = getFiles;
    this.dispatchAction = dispatchAction;
    this.subscribeAction = subscribeAction;
    this.advertisingBoards = [];
  }

  applyCameraMode(viewMode: ViewMode) {
    let nextView: View;

    switch(viewMode) {
      case ViewMode.BIRDS_EYE: {
        if (!this.cachedViews[ViewMode.BIRDS_EYE]) {
          this.cachedViews[ViewMode.BIRDS_EYE] = new BirdsEyeView(this.container, this.renderer, this.scene, this);
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

    const advertisingBoardGeometry = new THREE.PlaneGeometry(16 * BOX_SIZE, 12 * BOX_SIZE);
    advertisingBoardGeometry.rotateY( - Math.PI / 2 );

    const advertisingBoard1Material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const advertisingBoard1 = new THREE.Mesh( advertisingBoardGeometry, advertisingBoard1Material );
    advertisingBoard1.position.set(
      (0 - 2) * BOX_SIZE,
      (8 + 2) * BOX_SIZE,
      8 * BOX_SIZE
    );
    advertisingBoard1.rotateY( Math.PI );
    advertisingBoard1['__WORLD_DIRECTION__'] = advertisingBoard1.getWorldDirection();
    this.advertisingBoards.push(advertisingBoard1);

    const advertisingBoard2Material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const advertisingBoard2 = new THREE.Mesh( advertisingBoardGeometry, advertisingBoard2Material );
    advertisingBoard2.rotateY( Math.PI / 2 );
    advertisingBoard2.position.set(
      8 * BOX_SIZE,
      (8 + 2) * BOX_SIZE,
      (0 - 2) * BOX_SIZE
    );
    advertisingBoard2['__WORLD_DIRECTION__'] = advertisingBoard2.getWorldDirection();
    this.advertisingBoards.push(advertisingBoard2);

    const advertisingBoard3Material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const advertisingBoard3 = new THREE.Mesh( advertisingBoardGeometry, advertisingBoard3Material );

    advertisingBoard3.position.set(
      (16 + 2) * BOX_SIZE,
      (8 + 2) * BOX_SIZE,
      8 * BOX_SIZE
    );
    advertisingBoard3['__WORLD_DIRECTION__'] = advertisingBoard3.getWorldDirection();
    this.advertisingBoards.push(advertisingBoard3);

    const advertisingBoard4Material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const advertisingBoard4 = new THREE.Mesh( advertisingBoardGeometry, advertisingBoard4Material );
    advertisingBoard4.rotateY( 3 * Math.PI / 2 );
    advertisingBoard4.position.set(
      8 * BOX_SIZE,
      (8 + 2) * BOX_SIZE,
      (16 + 2) * BOX_SIZE
    );
    advertisingBoard4['__WORLD_DIRECTION__'] = advertisingBoard4.getWorldDirection();
    this.advertisingBoards.push(advertisingBoard4);

    super.init();

    this.advertisingBoards.forEach(board => this.scene.add(board));

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
      modelManager: this.modelManager,
    }, this.getFiles, this.subscribeAction, this.stateLayer);
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
