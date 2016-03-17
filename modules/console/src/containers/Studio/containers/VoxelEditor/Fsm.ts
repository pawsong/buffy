import { EventEmitter, EventSubscription } from 'fbemitter';
const mapValues = require('lodash/mapValues');
const defaults = require('lodash/defaults');

export class State {
  _fsm: Fsm;
  _name: string;

  constructor(fsm, name, options) {
    this._fsm = fsm;
    this._name = name;
    Object.keys(options).forEach(key => {
      this[key] = options[key];
    });
  }

  transition(state, args) {
    return this._fsm.transition(state, args);
  }

  onEnter(args?: any) { }
  onLeave(args?: any) { }
  isIntersectable(args?: any) { }
  onMouseDown(args?: any) { }
  onMouseUp(args?: any) { }
  onInteract(args?: any) { }
};

export class Fsm extends EventEmitter {
  current: State;
  _initialState: string;
  _states: { [index: string]: State };

  constructor(initialState, states, defaultState = {}) {
    super();

    this._initialState = initialState;

    // Instantiate states
    this._states = mapValues(states, (value, key) => {
      return new State(this, key, defaults(value, defaultState));
    });
  }

  on(eventType: string, callback: Function): EventSubscription {
    return this.addListener(eventType, callback, this);
  }

  transition(state, args) {
    const prev = this.current._name;
    this.current.onLeave();

    this.current = this._states[state];
    this.current.onEnter(args);

    this.emit('transition', {
      from: prev,
      to: this.current._name,
    });
  }

  start() {
    if (!this.current) {
      this.current = this._states[this._initialState];
      this.current.onEnter();
      this.emit('start');
    }
  }

  stop() {
    if (this.current) {
      this.current.onLeave();
      this.current = undefined;
      this.emit('stop');
    }
  }
}

export default Fsm;
