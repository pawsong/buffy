import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import ZoneView from '../../../ZoneView';

import {
  PIXEL_NUM,
  PIXEL_UNIT,
  BOX_SIZE,
  MINI_PIXEL_SIZE,
  GRID_SIZE,
} from '../Constants';

import {
  ToolState,
  GetGameState,
  ObserveGameState,
  GameStateListener,
  GameStateSelector,
  GameStateObserver,
} from './interface';

import CursorManager from './CursorManager';

import { GameState, ToolType } from '../interface';

import * as tools from './tools';
import Fsm from './Fsm';

class GameZoneView extends ZoneView {
  camera: THREE.OrthographicCamera;
  cursorManager: CursorManager;

  private toolsFsm: Fsm<ToolState>;
  private gameStateListeners: GameStateListener[];

  constructor(container: HTMLElement, stateLayer: StateLayer, getGameState: GetGameState) {
    super(container, stateLayer);

    const raycaster = new THREE.Raycaster();
    this.cursorManager = new CursorManager(container, this.scene, raycaster, this.camera, this.terrainManager);

    this.gameStateListeners = [];

    const observeGameState: ObserveGameState = (selector: GameStateSelector<any>, observer: GameStateObserver<any>) => {
      let state;

      const listener = (gameState: GameState) => {
        const nextState = selector(gameState);
        if (state !== nextState) {
          observer(nextState);
        }
      };
      this.gameStateListeners.push(listener);

      listener(getGameState());

      return () => {
        const index = this.gameStateListeners.indexOf(listener);
        if (index !== -1) this.gameStateListeners.splice(index, 1);
      };
    };

    this.toolsFsm = new Fsm<ToolState>();
    Object.keys(tools).forEach(toolName => this.toolsFsm.add(toolName, tools[toolName](this, stateLayer, getGameState, observeGameState)));
    observeGameState(gameState => gameState.selectedTool, selectedTool => this.toolsFsm.transition(ToolType[selectedTool]));
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

  onChange(gameState: GameState) {
    this.handleChange(gameState);
  }

  handleChange(gameState: GameState) {
    this.gameStateListeners.forEach(listener => listener(gameState));
  }

  destroy() {
    super.destroy();
    this.toolsFsm.stop();
    this.cursorManager.destroy();
  }
}

export default GameZoneView;
