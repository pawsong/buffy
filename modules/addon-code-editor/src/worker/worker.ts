import 'babel-polyfill';

import { EventEmitter, EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/addon/lib/StateLayer';
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
      if (ev.data.ack === true) {
        const ack = this.acks[ev.data.id];
        if (ack) {
          ack(ev.data.packet);
        }
      } else {
        this.emitter.emit(ev.data.type, ev.data.params);
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

const socket = new FakeSocket();

self.postMessage({ type: MsgFromWorkerType.CONNECT });

(async () => {
  const initParams = await new Promise<any>(resolve => {
    once(self, MsgToWorkerType.INIT, data => {
      resolve(data.params);
    });
  });

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

  // pasta global object
  // consumed by core modules
  self.$pasta = {} as PastaContext;
  self.$pasta.stateLayer = stateLayer;
  self.$pasta.log = function (msg) {
    console.log(msg);
  };

  const url = await new Promise<string>(resolve => {
    once(self, MsgToWorkerType.START, ({ url }) => resolve(url));
  });
  self.importScripts(url);
})().catch(error => {
  console.error(error);
});
