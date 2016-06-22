import THREE from 'three';
const invariant = require('fbjs/lib/invariant');
import mapValues from 'lodash/mapValues';
import { Differ, Schema } from '@pasta/helper/lib/diff';
import SimpleComponent from './SimpleComponent';

import Fsm, { State, HandlerResult, EventHandlers } from './Fsm';
export { HandlerResult, EventHandlers }

export interface MouseUpParams {
  event: MouseEvent;
}

export interface MouseDownParams {
  event: MouseEvent;
}

abstract class ToolState extends State {
  static STATE_IDLE = 'idle';
  static STATE_PAUSE = 'pause';
  static STATE_WAIT = 'wait';

  static EVENT_START = 'start'; // Only for idle state
  static EVENT_STOP = 'stop';

  static EVENT_PAUSE = 'pause';
  static EVENT_RESUME = 'resume'; // Only for pausee state

  constructor(eventHandlers?: EventHandlers) {
    super(eventHandlers || {});

    // Go to idle on stop in any state.
    this.eventHandlers[ToolState.EVENT_STOP] = () => ({ state: ToolState.STATE_IDLE });
    this.eventHandlers[ToolState.EVENT_PAUSE] = () => ({ state: ToolState.STATE_PAUSE });

    this.eventHandlers[ToolState.EVENT_ENTER] = this.onEnter.bind(this);
    this.eventHandlers[ToolState.EVENT_LEAVE] = this.onLeave.bind(this);
  }

  onEnter(params?: any): HandlerResult { }
  onLeave(params?: any): HandlerResult { }
}

export { ToolState }

export interface ToolStates {
  [index: string]: ToolState;
}

class IdleState extends ToolState {
  constructor() {
    // Just wait start event.
    super({
      [ToolState.EVENT_START]: () => ({ state: ToolState.STATE_WAIT }),
    });
  }
}

class PauseState extends ToolState {
  constructor() {
    // Just wait start event.
    super({
      [ToolState.EVENT_STOP]: () => ({ state: ToolState.STATE_IDLE }),
      [ToolState.EVENT_RESUME]: () => ({ state: ToolState.STATE_WAIT }),
    });
  }
}

abstract class Tool<U /* ToolType */, V /* InitParams */, P, S, T> extends SimpleComponent<P, S, T> {
  protected fsm: Fsm;

  constructor(params: V) {
    super();
    this.onInit(params);

    const states = this.createStates();

    [
      ToolState.STATE_IDLE,
      ToolState.STATE_PAUSE,
    ].forEach(stateName => {
      invariant(!states[stateName], `Cannot use reserved state name: ${stateName}`);
    })

    invariant(states[ToolState.STATE_WAIT], `State ${ToolState.STATE_WAIT} is required`);

    const finalStates: ToolStates = Object.assign({
      [ToolState.STATE_IDLE]: new IdleState(),
      [ToolState.STATE_PAUSE]: new PauseState(),
    }, states);

    this.fsm = new Fsm(finalStates, ToolState.STATE_IDLE);
  }

  abstract getToolType(): U;

  abstract onInit(params: V): any;
  abstract createStates(): ToolStates;

  start(props: P) {
    super.start(props);
    this.fsm.trigger(ToolState.EVENT_START);
  }

  stop() {
    this.fsm.trigger(ToolState.EVENT_STOP);
    super.stop();
  }

  pause() {
    this.fsm.trigger(ToolState.EVENT_PAUSE);
  }

  resume() {
    this.fsm.trigger(ToolState.EVENT_RESUME);
  }

  destroy() {
    this.onDestroy();
  }

  abstract onDestroy();
}

export default Tool;
