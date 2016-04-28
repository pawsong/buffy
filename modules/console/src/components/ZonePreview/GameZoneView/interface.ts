import StateLayer from '@pasta/core/lib/StateLayer';
import { StateInterface } from './Fsm';
import { GameState } from '../interface';
import GameZoneView from './GameZoneView';

export interface GameStateListener {
  (gameState: GameState): any;
}

export interface GameStateSelector<T> {
  (gameState: GameState): T;
}

export interface GameStateObserver<T> {
  (state: T): any;
}

export interface RemoveObserver {
  (): void;
}

export interface ObserveGameState {
  <T>(selector: GameStateSelector<T>, listener: GameStateObserver<T>): RemoveObserver;
}

export interface GetGameState {
  (): GameState;
}

export interface ToolStateFactory {
  (view: GameZoneView, stateLayer: StateLayer, getGameState: GetGameState, observeGameState: ObserveGameState): ToolState;
}

export interface ToolState extends StateInterface {
  isIntersectable?: (args?: any) => any;
  onMouseDown?: (args?: any) => any;
  onMouseUp?: (args?: any) => any;
  onInteract?: (args?: any) => any;
}
