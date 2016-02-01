import 'babel-polyfill';

import { EventEmitter, EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';
import { ContextInterface } from '@pasta/core/lib/Context';
import {
  MsgToWorkerType,
  MsgFromWorkerType,
} from '../constants';
import { once } from '../util';

require('script!../../jspm_packages/system.src');
require('../../config');

declare const self: WorkerGlobalScope;

interface Acks {
  [index: string]: Function;
}

class FakeSocket {
  private static _msgId = -1;
  static issueId = () => ++FakeSocket._msgId;

  acks: Acks;
  emitter: EventEmitter;

  constructor() {
    this.acks = {};
    this.emitter = new EventEmitter();

    self.addEventListener('message', (ev) => {
      switch (ev.data.type) {
        case MsgToWorkerType.EVENT:
          this.emitter.emit(ev.data.method, ev.data.params);
          return;
        case MsgToWorkerType.ACK:
          const ack = this.acks[ev.data.id];
          if (ack) {
            ack(ev.data.packet);
          }
          return;
        case MsgToWorkerType.START:
          return;
        default:
          console.log(`Invalid message type: ${ev.data.type}`);
          return;
      }
    });
  }

  addListener(type: string, listener: Function) {
    return this.emitter.addListener(type, listener);
  }

  emit(method, params, callback) {
    if (!callback) {
      return self.postMessage({
        type: MsgFromWorkerType.RPC,
        method,
        params,
      });
    }
    const id = FakeSocket.issueId();
    this.acks[id] = callback;
    return self.postMessage({
      type: MsgFromWorkerType.RPC,
      method,
      params,
      id,
      ack: true,
    });
  }
}

self.postMessage({ type: MsgFromWorkerType.CONNECT });

(async () => {
  const initParams = await new Promise<any>(resolve => {
    once(self, MsgToWorkerType.INIT, data => {
      resolve(data.params);
    });
  });

  const socket = new FakeSocket();

  // Create StateLayer instance from fake socket
  const stateLayer = new StateLayer({
    emit: (event, params, cb) => {
      socket.emit(event, params, cb);
    },
    listen: (event, handler) => {
      const token = socket.addListener(event, handler);
      return () => token.remove();
    },
    update: (cb) => {
      let timeoutId = setTimeout(update, 10);
      let then = Date.now();
      function update() {
        const now = Date.now();
        cb(now - then);
        then = now;
        timeoutId = setTimeout(update, 10);
      }
      return () => clearTimeout(timeoutId);
    },
  }, initParams);

  self.postMessage({ type: MsgFromWorkerType.INIT });

  // Load entry script.
  const url = await new Promise<string>(resolve => {
    once(self, MsgToWorkerType.START, ({ url }) => resolve(url));
  });

  // Fill context object.
  const { default: Context } = await System.import('@pasta/core/lib/Context');

  // Context consumed by core modules
  const _Context: ContextInterface = {
    stateLayer,
    log: msg => console.log(msg),
  };
  Object.keys(_Context).forEach(key => Context[key] = _Context[key]);

  await System.import(`${url}!ts`);
})().catch(err => console.error(err));
