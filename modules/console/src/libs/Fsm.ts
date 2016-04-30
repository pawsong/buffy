type StateName = string;

interface Transition {
  state: string;
  params?: any;
}

export type HandlerResult = Transition | void;

interface EventHandler {
  (data?: any): HandlerResult;
}

export interface EventHandlers {
  [index: string]: EventHandler;
}

class State { // Set of event handlers
  static EVENT_ENTER = 'enter';
  static EVENT_LEAVE = 'leave';

  eventHandlers: EventHandlers;

  constructor(eventHandlers: EventHandlers) {
    this.eventHandlers = eventHandlers;
  }

  on(event, data?): Transition | void {
    const handler = this.eventHandlers[event];
    if (!handler) return;
    return handler(data);
  }
}

export { State };

interface States {
  [index: string]: State;
}

class Fsm {
  current: State;
  private states: States;

  constructor(states: States, initialState: string) {
    this.states = states;

    const state = this.states[initialState];
    if (!state) throw new Error(`Invalid state: ${initialState}`);

    this.enterState(state);
  }

  trigger(event: string, data?: any) {
    const transition = this.current.on(event, data);
    if (transition) this.transitionTo(<Transition>transition);
  }

  private transitionTo(transition: Transition) {
    const next = this.states[transition.state];
    if (!next) throw new Error(`Invalid state: ${transition.state}`);

    if (__DEV__) {
      console.log(`transition from`,  this.current, 'to', next);
    }

    this.current.on(State.EVENT_LEAVE);
    this.enterState(next, transition.params);
  }

  private enterState(state: State, params?: any) {
    this.current = state;
    this.trigger(State.EVENT_ENTER, params);
  }
}

export default Fsm;
