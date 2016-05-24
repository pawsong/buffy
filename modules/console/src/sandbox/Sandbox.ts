import { EventEmitter } from 'fbemitter';
import * as Promise from 'bluebird';
import StateLayer from '@pasta/core/lib/StateLayer';
import Interpreter from './Interpreter';
import { inject as injectContext } from './context';

const INFINITE_LOOP_GUARD_LIMIT = 1000;

export interface Scripts {
  [index: string /* event */]: string[];
}

class Process {
  emitter: EventEmitter;
  stateLayer: StateLayer;
  scripts: Scripts;
  playerId: string;
  running: boolean;

  constructor(stateLayer: StateLayer, playerId: string, scripts: Scripts) {
    this.stateLayer = stateLayer;
    this.playerId = playerId;
    this.scripts = scripts;
    this.running = true;

    this.emitter = new EventEmitter();
  }

  on(event: string, handler: Function) {
    return this.emitter.addListener(event, handler);
  }

  emit(event: string) {
    const codes = this.scripts[event];
    if (codes) {
      codes.forEach(code => this.exec(code));
    }
  }

  exec(code: string) {
    const interpreter = new Interpreter(code, (instance, scope) => injectContext(instance, scope, {
      stateLayer: this.stateLayer,
      playerId: this.playerId,
      interpreter: instance,
    }, () => nextStep()));

    let infiniteLoopGuard = 0;

    const nextStep = () => {
      if (!this.running) {
        this.emitter.emit('exit');
        return;
      }

      // Do not step when process is not running
      if (!interpreter.step()) {
        this.emitter.emit('exit');
        return;
      }

      if (interpreter.paused_) {
        // Response will resume this interpreter
        return;
      }

      // TODO: Support detailed speed setting
      // TODO: Prevent halting vm on infinite loop
      infiniteLoopGuard++;
      if (infiniteLoopGuard > INFINITE_LOOP_GUARD_LIMIT) {
        infiniteLoopGuard = 0;
        setTimeout(nextStep, 0);
      } else {
        nextStep();
      }
    };
    nextStep();
  }

  kill() {
    this.running = false;
    this.stateLayer = null;
  }
}

class Sandbox {
  stateLayer: StateLayer;
  processes: Process[];

  private frameId: number;
  private keyEventListener: (e: KeyboardEvent) => any;

  private keyState: { [index: string]: boolean };

  running: boolean;

  constructor(stateLayer: StateLayer) {
    this.stateLayer = stateLayer;
    this.processes = [];

    this.running = false;
  }

  listenKeyEvent = (e: KeyboardEvent) => {
    this.keyState[e.keyCode] = e.type === 'keydown';
  }

  update = () => {
    this.frameId = requestAnimationFrame(this.update);
    Object.keys(this.keyState).forEach(keyCode => {
      if (this.keyState[keyCode]) this.emit(`keydown_${keyCode}`);
    })
  }

  exec(playerId: string, scripts: Scripts): Promise<void> {
    if (!this.running) {
      this.running = true;

      this.keyState = {};
      window.addEventListener('keydown', this.listenKeyEvent, false);
      window.addEventListener('keyup', this.listenKeyEvent, false);
      this.frameId = requestAnimationFrame(this.update);
    }

    const process = new Process(this.stateLayer, playerId, scripts);
    this.processes.push(process);

    return new Promise<void>((resolve, reject) => {
      // TODO: Reject promise when error occurred.
      // process.on('exit', () => resolve(null));
    });
  }

  emit(event: string) {
    this.processes.forEach(process => process.emit(event));
  }

  reset() {
    this.processes.forEach(process => process.kill());
    this.processes = [];

    if (this.running) {
      this.running = false;

      window.removeEventListener('keydown', this.listenKeyEvent, false);
      window.removeEventListener('keyup', this.listenKeyEvent, false);
      cancelAnimationFrame(this.frameId);
    }
  }

  destroy() {
    this.reset();
    this.stateLayer = null;
  }
}

export default Sandbox;
