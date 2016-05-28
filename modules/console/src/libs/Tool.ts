import * as THREE from 'three';
import * as invariant from 'invariant';
import mapValues from 'lodash/mapValues';
import { Differ, Schema } from '@pasta/helper/lib/diff';
import SimpleComponent from './SimpleComponent';

import Fsm, { State, HandlerResult, EventHandlers } from './Fsm';
export { HandlerResult, EventHandlers }

const objectAssign = require('object-assign');

export interface MouseUpParams {
  event: MouseEvent;
}

export interface MouseDownParams {
  event: MouseEvent;
}

abstract class ToolState extends State {
  static STATE_IDLE = 'idle';
  static STATE_WAIT = 'wait';

  static EVENT_START = 'start'; // Only for idle state
  static EVENT_STOP = 'stop';

  constructor(eventHandlers?: EventHandlers) {
    super(eventHandlers || {});

    // Go to idle on stop in any state.
    this.eventHandlers[ToolState.EVENT_STOP] = () => ({ state: ToolState.STATE_IDLE });

    this.eventHandlers[ToolState.EVENT_ENTER] = this.onEnter.bind(this);
    this.eventHandlers[ToolState.EVENT_LEAVE] = this.onLeave.bind(this);
  }

  onEnter(params?: any): HandlerResult { }
  onLeave(params?: any): HandlerResult { }
}

export { ToolState }

interface ToolStates {
  [index: string]: ToolState;
}

class IdleState extends ToolState {
  constructor(private tool: Tool<any, any, any, any, any>) {
    // Just wait start event.
    super({
      [ToolState.EVENT_START]: () => ({ state: ToolState.STATE_WAIT }),
    });
  }
}

abstract class Tool<U /* ToolType */, V /* InitParams */, P, S, T> extends SimpleComponent<P, S, T> {
  protected fsm: Fsm;

  constructor(params: V) {
    super();
    const idle = new IdleState(this);
    const states: ToolStates = objectAssign({ [ToolState.STATE_IDLE]: idle }, this.init(params));
    invariant(states[ToolState.STATE_WAIT], `${ToolState.STATE_WAIT} is missing`);

    const finalStates = mapValues(states, state => {
      const enterEventHandler = state.eventHandlers[ToolState.EVENT_ENTER];
      state.eventHandlers[ToolState.EVENT_ENTER] = (params: any) => enterEventHandler(params);
      return state;
    });

    this.fsm = new Fsm(finalStates, ToolState.STATE_IDLE);
  }

  abstract getToolType(): U;

  abstract init(params: V);

  start(props: P) {
    super.start(props);
    this.fsm.trigger(ToolState.EVENT_START);
  }

  stop() {
    this.fsm.trigger(ToolState.EVENT_STOP);
    super.stop();
  }

  abstract destroy();
}

export default Tool;
