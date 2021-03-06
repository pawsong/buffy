import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
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
  PIXEL_SCALE,
} from '../../../canvas/Constants';

import {
  Action,
  WorldEditorState,
  FileState,
  DispatchAction,
  GetState,
  EditorMode,
  ViewMode,
  ActionListener,
  WorldState,
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
  state: WorldState;
  container: HTMLElement;
  modelManager: ModelManager;
  stateLayer: StateLayer;
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

  private state: WorldState;

  private view: View;
  private cachedViews: { [index: string]: View };

  private stateLayer: StateLayer;
  // private getGameState: GetState;
  private dispatchAction: DispatchAction;
  private getFiles: () => SourceFileDB;

  constructor({
    container,
    modelManager,
    stateLayer,
    state,
    dispatchAction,
    getFiles,
  }: WorldEditorCanvasOptions) {
    super(container, modelManager, () => {
      return { playerId: this.state.file.playerId };
    });

    this.state = state;
    this.cachedViews = {};
    this.stateLayer = stateLayer;
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
    const advertisingBoardGeometry = new THREE.PlaneGeometry(16 * PIXEL_SCALE, 12 * PIXEL_SCALE);
    advertisingBoardGeometry.rotateY( - Math.PI / 2 );

    const advertisingBoard1Material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const advertisingBoard1 = new THREE.Mesh( advertisingBoardGeometry, advertisingBoard1Material );
    advertisingBoard1.position.set(
      (0 - 2) * PIXEL_SCALE,
      (8 + 2) * PIXEL_SCALE,
      8 * PIXEL_SCALE
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
      8 * PIXEL_SCALE,
      (8 + 2) * PIXEL_SCALE,
      (0 - 2) * PIXEL_SCALE
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
      (16 + 2) * PIXEL_SCALE,
      (8 + 2) * PIXEL_SCALE,
      8 * PIXEL_SCALE
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
      8 * PIXEL_SCALE,
      (8 + 2) * PIXEL_SCALE,
      (16 + 2) * PIXEL_SCALE
    );
    advertisingBoard4['__WORLD_DIRECTION__'] = advertisingBoard4.getWorldDirection();
    this.advertisingBoards.push(advertisingBoard4);

    super.init();
    this.scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );
    this.renderer.setClearColor(this.scene.fog.color);

    this.advertisingBoards.forEach(board => this.scene.add(board));

    // Initialize modes
    this.editModeState = new EditModeState({
      view: this,
      getFiles: this.getFiles,
      dispatchAction: this.dispatchAction,
      modelManager: this.modelManager,
    }, this.getFiles, this.stateLayer, this.state);
    this.editModeState.init();

    this.playModeState = new PlayModeState({
      view: this,
      stateLayer: this.stateLayer,
    }, this.getFiles, this.state);
    this.playModeState.init();

    this.modeFsm = new Fsm({
      [EditorMode[EditorMode.EDIT]]: this.editModeState,
      [EditorMode[EditorMode.PLAY]]: this.playModeState,
    }, EditorMode[this.state.editor.common.mode], this.state);

    this.render();
  }

  initCamera(): THREE.Camera {
    this.applyCameraMode(this.state.editor.playMode.viewMode);
    return this.view.camera;
  }

  onWindowResize() {
    this.view.onResize();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.render();
  }

  render(dt = 0) {
    super.render(dt);
    this.view.onUpdate();
    this.renderer.render(this.scene, this.camera);
  }

  addCameraPosition(pos: Position) {
    this.view.addPosition(pos);
  }

  setCameraPosition(pos: Position) {
    this.view.setPosition(pos);
  }

  onChange(state: WorldState) {
    if (this.state.editor.common.mode !== state.editor.common.mode) {
      this.modeFsm.trigger(ModeEvents.CHANGE_MODE, state);
    } else {
      this.modeFsm.trigger(ModeEvents.CHANGE_STATE, state);
    }

    this.state = state;

    this.render();
  }

  destroy() {
    this.editModeState.destroy();
    this.playModeState.destroy();

    // Destroy views
    Object.keys(this.cachedViews).forEach(key => this.cachedViews[key].onDispose());

    super.destroy();
  }
}

export default WorldEditorCanvas;
