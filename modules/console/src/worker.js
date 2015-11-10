import 'babel-polyfill';
import Promise from 'bluebird';
import EventEmitter from 'eventemitter3';

import {
  GameObject,
  ObjectManager,
} from '@pasta/game-class';

import {
  Protocol,
  createAdapter,
} from '@pasta/game-api';

const genMsgId = (() => {
  let _msgId = 0;
  return () => ++_msgId;
})();

const requests = {};
function request(apiName, payload) {
  const id = genMsgId();
  self.postMessage({ id, apiName, payload, type: 'api' });
  return new Promise((resolve, reject) => {
    requests[id] = { resolve, reject };
  });
}

const socket = new EventEmitter();
const handlers = {
  socket: body => {
    console.log(body);
    return socket.emit(body.event, body.payload);
  },

  response: data => {
    const req = requests[data.id];
    if (!req) {
      // TODO: Error handling
      return;
    }

    if (data.error) {
      req.reject(data.error);
    } else {
      req.resolve(data.result);
    }

    delete requests[data.id];
  },
};

const manager = new ObjectManager(GameObject);
manager.connect(socket);

self.addEventListener('message', ({ data }) => {
  const handler = handlers[data.type];
  if (!handler) {
    // TODO: Log
    return;
  }
  handler(data.body || {});
});

/**
 * pasta global object
 *
 * consumed by core modules
 */
self.$pasta = {};

self.$pasta.api = createAdapter({
  [Protocol.IO]: (apiName, payload) => {
    return request(apiName, payload);
  },
  [Protocol.HTTP]: () => {
  },
});

self.$pasta.log = function (msg) {
  console.log(msg);
};

self.$pasta.id = '';
