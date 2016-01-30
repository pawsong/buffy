import * as axios from 'axios';
import { EventEmitter } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';

import {
  MsgToWorkerType,
  MsgFromWorkerType,
} from '../constants';

function once(target: EventTarget, type: string, fn: (data: any) => any) {
  const _handler = (msg: MessageEvent) => {
    if (msg.data.type !== type) { return; }
    fn(msg.data);
    target.removeEventListener('message', _handler);
  };
  target.addEventListener('message', _handler);
}

class UserProcess {
  terminated = false;
  emitter = new EventEmitter();
  worker: Worker;
  cancelPropagate: Function;

  constructor(source: string, stateLayer: StateLayer) {
    this.initialize(source, stateLayer).catch(reason => {
      console.error(reason);
    });
  }

  async initialize(source: string, stateLayer: StateLayer) {
    const res = await this.wait(
      axios.post('/addons/code-editor/compile', { source }) as Promise<axios.Response>
    );
    if (this.terminated) { return; }

    const { url } = res.data;

    this.worker = new Worker('/addons/code-editor/worker.js');

    // Wait CONNECT
    await this.wait(new Promise(resolve => {
      once(this.worker, MsgFromWorkerType.CONNECT, resolve);
    }));
    if (this.terminated) { return; }

    this.worker.postMessage({
      type: MsgToWorkerType.INIT,
      params: stateLayer.store.serialize(),
    });

    // Propagate all events for store from socket to worker.
    this.cancelPropagate = stateLayer.propagate((method, params) => {
      this.worker.postMessage({
        type: MsgToWorkerType.EVENT,
        method,
        params,
      });
    });

    // Wait INIT
    await this.wait(new Promise(resolve => {
      once(this.worker, MsgFromWorkerType.INIT, resolve);
    }));
    if (this.terminated) { return; }

    this.worker.addEventListener('message', (ev) => {
      const { data } = ev;
      if (data.type !== MsgFromWorkerType.RPC) {
        // TODO: Log
        return;
      }

      const method = stateLayer.rpc[data.method];
      if (!method) {
        console.error(`${data.method} is not a rpc method`);
        return;
      }

      if (!data.ack) {
        method(data.params);
      } else {
        method(data.params).then(result => this.worker.postMessage({
          type: MsgToWorkerType.ACK,
          result,
          id: data.id,
        })).catch(error => this.worker.postMessage({
          type: MsgToWorkerType.ACK,
          error,
          id: data.id,
        }));
      }
    });

    // Now ready. Start!
    this.worker.postMessage({
      type: MsgToWorkerType.START,
      url: url,
    });
  }

  wait<T>(promise: Promise<T>): Promise<T> {
    if (this.terminated) {
      return Promise.resolve<T>(null);
    }
    return new Promise<T>((resolve, reject) => {
      const token = this.emitter.once('terminate', () => {
        resolve(null);
      });
      promise.then(result => {
        token.remove();
        resolve(result);
      }).catch(reason => {
        token.remove();
        reject(reason);
      });
    });
  };

  terminate() {
    this.terminated = true;
    this.emitter.emit('terminate');

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    if (this.cancelPropagate) {
      this.cancelPropagate();
      this.cancelPropagate = null;
    }
  }
}

export default UserProcess;
