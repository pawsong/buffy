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
} from '../types';

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
  getFiles: () => SourceFileDB;
}

/*
 * WorldEditorCanvas can be connected to following data sources:
 *   - file (in edit mode)
 *   - stateLayer (in play mode)
 */
class WorldEditorCanvas extends ZoneCanvas {
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

  constructor({
    container,
    modelManager,
    stateLayer,
    getState,
    dispatchAction,
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
    this.scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );
    this.renderer.setClearColor(this.scene.fog.color);

    this.advertisingBoards.forEach(board => this.scene.add(board));

    // Initialize modes
    this.editModeState = new EditModeState(this.getGameState, {
      view: this,
      getState: this.getGameState,
      getFiles: this.getFiles,
      dispatchAction: this.dispatchAction,
      modelManager: this.modelManager,
    }, this.getFiles, this.stateLayer);
    this.editModeState.init();

    this.playModeState = new PlayModeState(this.getGameState, {
      view: this,
      stateLayer: this.stateLayer,
      getState: this.getGameState,
    }, this.getFiles);
    this.playModeState.init();

    this.modeFsm = new Fsm({
      [EditorMode[EditorMode.EDIT]]: this.editModeState,
      [EditorMode[EditorMode.PLAY]]: this.playModeState,
    }, EditorMode[this.state.editMode.tool]);

    this.render();
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
    if (this.state.common.mode !== state.common.mode) {
      this.modeFsm.trigger(ModeEvents.CHANGE_MODE, state.common.mode);
    }
    this.modeFsm.trigger(ModeEvents.CHANGE_STATE, state);
    this.state = state;
  }

  destroy() {
    this.editModeState.destroy();
    this.playModeState.destroy();

    // Destroy views
    Object.keys(this.cachedViews).forEach(key => this.cachedViews[key].onDispose());

    this.cursorManager.destroy();

    super.destroy();
  }
}

export default WorldEditorCanvas;
