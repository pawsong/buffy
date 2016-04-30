import * as THREE from 'three';
import * as invariant from 'invariant';
import mapValues from 'lodash/mapValues';

import Fsm, { State, HandlerResult, EventHandlers } from './Fsm';
export { HandlerResult, EventHandlers }

import shallowEqual from '../utils/shallowEqual';

const objectAssign = require('object-assign');

export interface MouseUpParams {
  event: MouseEvent;
}

export interface MouseDownParams {
  event: MouseEvent;
}

abstract class ToolState<T/* props */, U /* app state */> extends State {
  static STATE_IDLE = 'idle';
  static STATE_WAIT = 'wait';

  static EVENT_START = 'start'; // Only for idle state
  static EVENT_STOP = 'stop';

  props: T;

  constructor(eventHandlers?: EventHandlers) {
    super(eventHandlers || {});

    // Go to idle on stop in any state.
    this.eventHandlers[ToolState.EVENT_STOP] = () => ({ state: ToolState.STATE_IDLE });

    this.eventHandlers[ToolState.EVENT_ENTER] = this.onEnter.bind(this);
    this.eventHandlers[ToolState.EVENT_LEAVE] = this.onLeave.bind(this);
  }

  mapStateToProps(appState: U): T { return <T>{}; }

  abstract render();

  onEnter<U>(params?: U): HandlerResult { }
  onLeave(): HandlerResult { }
}

export { ToolState }

interface ToolStates {
  [index: string]: ToolState<any, any>;
}

class IdleState extends ToolState<void, any> {
  constructor(private tool: Tool<any, any, any>) {
    // Just wait start event.
    super({
      [ToolState.EVENT_START]: () => ({ state: ToolState.STATE_WAIT }),
    });
  }

  onEnter() {
    this.tool.enterIdleState();
  }

  render() {}
}

abstract class Tool<T /* AppState */, U /* ToolType */, V /* InitParams */> {
  protected fsm: Fsm;

  constructor(params: V, getAppState: () => T) {
    const idle = new IdleState(this);
    const states: ToolStates = objectAssign({ [ToolState.STATE_IDLE]: idle }, this.init(params));
    invariant(states[ToolState.STATE_WAIT], `${ToolState.STATE_WAIT} is missing`);

    const finalStates = mapValues(states, state => {
      const enterEventHandler = state.eventHandlers[ToolState.EVENT_ENTER];
      state.eventHandlers[ToolState.EVENT_ENTER] = (params: any) => {
        state.props = state.mapStateToProps(getAppState());
        enterEventHandler(params);
        state.render();
      };
      return state;
    });

    this.fsm = new Fsm(finalStates, ToolState.STATE_IDLE);
  }

  abstract getToolType(): U;

  abstract init(params: V);
  enterIdleState() {}

  updateProps(appState: T) {
    const currentState = (<ToolState<any, any>>this.fsm.current);
    const nextProps = currentState.mapStateToProps(appState);

    const shouldRender = !shallowEqual(currentState.props, nextProps);
    currentState.props = nextProps;

    if (shouldRender) currentState.render();
  }

  onStart() {
    this.fsm.trigger(ToolState.EVENT_START);
  }

  onStop() {
    this.fsm.trigger(ToolState.EVENT_STOP);
  }

  abstract destroy();
}

export default Tool;
