import { EventEmitter, EventSubscription } from 'fbemitter';

export interface StateInterface {
  onEnter: () => any;
  onLeave: () => any;
}

class Fsm<T extends StateInterface> {
  current: T;
  states: { [index: string]: T };
  emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.states = {};
  }

  on(eventType: string, callback: Function): EventSubscription {
    return this.emitter.addListener(eventType, callback, this);
  }

  add(stateName: string, state: T) {
    if (this.states[stateName]) {
      throw new Error(`State ${stateName} already exists`);
    }
    this.states[stateName] = state;
  }

  start(stateName: string) {
    if (this.current) { throw new Error('Fsm is already running'); }

    const state = this.states[stateName];
    if (!state) { throw new Error(`Cannot find state ${stateName}`); }

    this.current = state;
    this.current.onEnter();
    this.emitter.emit('start');
  }

  stop() {
    if (this.current) {
      this.current.onLeave();
      this.current = undefined;
      this.emitter.emit('stop');
    }
  }

  transition(stateName) {
    const next = this.states[stateName];
    if (!next) { throw new Error(`Cannot find state ${stateName}`); }

    if (this.current) {
      this.current.onLeave();
    }

    this.current = next;
    this.current.onEnter();

    // this.emitter.emit('transition', {
    //   from: prev,
    //   to: this.current._name,
    // });
  }
}

export default Fsm;