import EventEmitter from 'eventemitter3';
import _ from 'lodash';

class State {
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

  onEnter() { }
  onLeave() { }
};

class Fsm extends EventEmitter {
  constructor(initialState, states, defaultState = {}) {
    super();

    this._initialState = initialState;

    // Instantiate states
    this._states = _.mapValues(states, (value, key) => {
      return new State(this, key, _.defaults(value, defaultState));
    });
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
