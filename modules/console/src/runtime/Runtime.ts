import StateLayer from '@pasta/core/lib/StateLayer';
import Interpreter from './Interpreter';
import { inject as injectContext } from './context';

interface Scripts {
  [index: string /* event */]: string[];
}

class Process {
  stateLayer: StateLayer;
  scripts: Scripts;
  running: boolean;

  constructor(stateLayer: StateLayer, scripts: Scripts) {
    this.stateLayer = stateLayer;
    this.scripts = scripts;
    this.running = true;
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
      interpreter: instance,
    }, () => nextStep()));

    const nextStep = () => {
      if (!this.running) {
        // return reject(new Error('Stopped'));
        return;
      }

      // Do not step when process is not running
      if (!interpreter.step()) {
        // return resolve();
        return;
      }

      if (interpreter.paused_) {
        // Response will resume this interpreter
        return;
      }

      // TODO: Support detailed speed setting
      // TODO: Prevent halting vm on infinite loop
      nextStep();
      // setTimeout(nextStep, 0);
    };
    nextStep();
  }

  kill() {
    this.running = false;
    this.stateLayer = null;
  }
}

class Runtime {
  stateLayer: StateLayer;
  processes: Process[];

  constructor(stateLayer: StateLayer) {
    this.stateLayer = stateLayer;
    this.processes = [];
  }

  exec(scripts: Scripts) {
    const process = new Process(this.stateLayer, scripts);
    this.processes.push(process);
  }

  emit(event: string) {
    this.processes.forEach(process => process.emit(event));
  }

  killAll() {
    this.processes.forEach(process => process.kill());
    this.processes = [];
  }

  destroy() {
    this.killAll();
    this.stateLayer = null;
  }
}

export default Runtime;
