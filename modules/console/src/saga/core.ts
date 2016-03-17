import { Saga, Task } from 'redux-saga';

export class UnlistenableTask {
  task: Task<any>;
  thenCallbacks: any[];
  catcCallbacks: any[];

  constructor(task: Task<any>) {
    this.task = task;
    this.initCallbacks();

    this.task.done
      .then(result => {
        this.thenCallbacks.forEach(handler => handler(result));
      })
      .catch(error => {
        this.catcCallbacks.forEach(handler => handler(error));
      });
  }

  private initCallbacks() {
    this.thenCallbacks = [];
    this.catcCallbacks = [];
  }

  onThen(callback) {
    this.thenCallbacks.push(callback);
    return this;
  }

  onCatch(callback) {
    this.catcCallbacks.push(callback);
    return this;
  }

  unlisten() {
    this.initCallbacks();
  }

  cancel() {
    this.task.cancel();
  }
}

export interface ImmutableTask<T> {
  name: string;
  state:  'ready' | 'running' | 'done';
  result?: T;
  error?: Error;
  task?: UnlistenableTask;
}

export function isRunning(sagaTask: ImmutableTask<any>) {
  return sagaTask.state === 'running';
}
