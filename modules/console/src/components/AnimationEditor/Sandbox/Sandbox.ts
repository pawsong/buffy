import { EventEmitter } from 'fbemitter';
import ModelCanvas from '../../../canvas/ModelCanvas';
import Interpreter from './Interpreter';

class Animation {
  private elapsed: number;

  constructor(private duration: number, private progress: (dt: number) => any, private callback: () => any) {
    this.elapsed = 0;
  }

  update(delta: number): boolean {
    this.elapsed += delta;

    const exceed = this.elapsed - this.duration;
    const exceeded = exceed >= 0;

    if (exceeded) {
      this.progress(delta - exceed);
      this.callback();
    } else {
      this.progress(delta);
    }

    return !exceeded;
  }
}

export function estimateTime(code: string): number {
  let time = 0;

  const interpreter = new Interpreter(code, (interpreter, scope) => {
    interpreter.setProperty(scope, 'moveForward', interpreter.createNativeFunction((duration) => time += duration));
    interpreter.setProperty(scope, 'jump', interpreter.createNativeFunction((duration) => time += duration));
    interpreter.setProperty(scope, 'rotateLeft', interpreter.createNativeFunction((duration) => time += duration));
    interpreter.setProperty(scope, 'scaleX', interpreter.createNativeFunction((duration) => time += duration));
    interpreter.setProperty(scope, 'scaleY', interpreter.createNativeFunction((duration) => time += duration));
    interpreter.setProperty(scope, 'scaleZ', interpreter.createNativeFunction((duration) => time += duration));

    interpreter.setProperty(scope, 'runConcurrently', interpreter.createNativeFunction(scripts => {
      let maxTime = 0;

      for (let i = 0, len = scripts.length; i < len; ++i) {
        const script = scripts.properties[i].toString();
        maxTime = Math.max(maxTime, estimateTime(script));
      }

      time += maxTime;
    }));
  });

  interpreter.run();
  return time;
}

class SandboxProcess {
  private emitter: EventEmitter;

  private estimatedTime: number;

  private concurrent: boolean;

  private interpreter: any;

  private pendingAnimations: Animation[];

  constructor(private sandbox: Sandbox, public pid: number, code: string) {
    this.emitter = new EventEmitter();

    this.concurrent = false;

    this.pendingAnimations = [];

    this.interpreter = new Interpreter(code, (interpreter, scope) => {
      interpreter.setProperty(scope, 'moveForward', interpreter.createAsyncFunction((duration, distance, callback) => {
        this.requestAnimation(duration, (dt: number) => {
          this.sandbox.canvas.moveForward(distance * dt / duration);
        }, () => callback.call(interpreter));
      }));

      interpreter.setProperty(scope, 'jump', interpreter.createAsyncFunction((duration, height, callback) => {
        const origin = this.sandbox.canvas.component.mesh.position.y;
        const dest = origin + height;

        let elapsed = 0;
        this.requestAnimation(duration, (dt: number) => {
          elapsed += dt;
          const value = (height / (duration * duration / 4)) * (- elapsed * elapsed + duration * elapsed) + origin;
          this.sandbox.canvas.moveY(value);
        }, () => callback.call(interpreter));
      }));

      interpreter.setProperty(scope, 'rotateLeft', interpreter.createAsyncFunction((duration, degree, callback) => {
        const angle = degree * Math.PI / 180;

        this.requestAnimation(duration, (dt: number) => {
          this.sandbox.canvas.rotateLeft(angle * dt / duration);
        }, () => callback.call(interpreter));
      }));

      interpreter.setProperty(scope, 'scaleX', interpreter.createAsyncFunction((duration, value, callback) => {
        const scaleX = this.sandbox.canvas.component.mesh.scale.x;
        const dest = value * scaleX;
        const delta = dest - scaleX;

        const animation = new Animation(duration, (dt: number) => {
          this.sandbox.canvas.scaleX(delta * dt / duration + this.sandbox.canvas.component.mesh.scale.x);
        }, () => callback.call(interpreter));

        this.pendingAnimations.push(animation);
      }));

      interpreter.setProperty(scope, 'scaleY', interpreter.createAsyncFunction((duration, value, callback) => {
        const scaleY = this.sandbox.canvas.component.mesh.scale.y;
        const dest = value * scaleY;
        const delta = dest - scaleY;

        const animation = new Animation(duration, (dt: number) => {
          this.sandbox.canvas.scaleY(delta * dt / duration + this.sandbox.canvas.component.mesh.scale.y);
        }, () => callback.call(interpreter));

        this.pendingAnimations.push(animation);
      }));

      interpreter.setProperty(scope, 'scaleZ', interpreter.createAsyncFunction((duration, value, callback) => {
        const scaleZ = this.sandbox.canvas.component.mesh.scale.z;
        const dest = value * scaleZ;
        const delta = dest - scaleZ;

        const animation = new Animation(duration, (dt: number) => {
          this.sandbox.canvas.scaleZ(delta * dt / duration + this.sandbox.canvas.component.mesh.scale.z);
        }, () => callback.call(interpreter));

        this.pendingAnimations.push(animation);
      }));

      interpreter.setProperty(scope, 'runConcurrently', interpreter.createAsyncFunction((scripts, callback) => {
        const promises = [];
        for (let i = 0, len = scripts.length; i < len; ++i) {
          const script = scripts.properties[i].toString();
          promises.push(new Promise(resolve => {
            const proc = this.sandbox.execute(script);
            proc.once('exit', resolve);
          }));
        }

        Promise.all(promises)
          .then(() => callback.call(interpreter))
          .catch(error => callback.call(interpreter, error));
      }));
    });
  }

  requestAnimation(duration: number, progress: (dt: number) => any, done: any) {
    this.pendingAnimations.push(new Animation(duration, progress, done));
  }

  once(eventType, listener) {
    return this.emitter.once(eventType, listener);
  }

  estimateTime(): number {
    this.estimatedTime = 0;
    // this.interpreter.run();

    return this.estimatedTime;
  }

  update = (dt: number): boolean => {
    if (this.interpreter.paused_) {
      for (let i = 0; i < this.pendingAnimations.length; ++i) {
        const animation = this.pendingAnimations[i];
        if (animation.update(dt) === false) {
          this.pendingAnimations.splice(i--, 1);
        }
      }
      return true;
    }

    while(this.interpreter.step()) {
      if (this.interpreter.paused_) return true;
    }

    this.emitter.emit('exit');
    return false;
  }
}

class Sandbox {
  private processId: number;
  private processes: SandboxProcess[];

  private frameId: number;
  private then: number;

  constructor(public canvas: ModelCanvas) {
    this.processId = 0;
    this.processes = [];
  }

  execute(script: string) {
    const pid = this.processId++;
    const proc = new SandboxProcess(this, pid, script);
    this.processes.push(proc);

    if (!this.frameId) this.startLoop();

    // Return estimated time
    return proc;
  }

  killAll() {
    this.stopLoop();
    this.processes = [];
  }

  private startLoop() {
    this.then = Date.now();
    this.frameId = requestAnimationFrame(this.update);
  }

  private stopLoop() {
    cancelAnimationFrame(this.frameId);
    this.frameId = undefined;
  }

  private update = () => {
    const now = Date.now();
    const elapsed = now - this.then;
    this.then = now;

    for (let i = 0; i < this.processes.length; ++i) {
      const proc = this.processes[i];
      if (!proc.update(elapsed)) this.processes.splice(i--, 1);
    }

    if (this.processes.length > 0) {
      this.frameId = requestAnimationFrame(this.update);
    } else {
      this.frameId = undefined;
    }

    this.canvas.render();
  }
}

export default Sandbox;
export { SandboxProcess }