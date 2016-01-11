import 'babel-polyfill';
import './patch/es.worker';

import * as Promise from 'bluebird';
import { EventEmitter } from 'fbemitter';

import GameStore from '@pasta/game-class/lib/GameStore';

import {
  Protocol,
  createAdapter,
} from '@pasta/game-api';

// Fake socket
const { socket, handleSocket } = (() => {
  const socket = new EventEmitter();
  function handleSocket(data) {
    return socket.emit(data.event, data.payload);
  }

  const ready = self.__ready;
  delete self.__ready;

  const token = socket.addListener('init', function () {
    token.remove();
    setTimeout(ready, 0);  
  });

  return { socket, handleSocket };
})();

// Handle response
const { request, handleResponse } = (() => {
  const genMsgId = (() => {
    let _msgId = 0;
    return () => ++_msgId;
  })();

  const requests = {};

  function request(apiName, payload) {
    const id = genMsgId();
    (self as any).postMessage({ id, apiName, payload, type: 'api' });
    return new Promise((resolve, reject) => {
      requests[id] = { resolve, reject };
    });
  }

  function handleResponse(data) {
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
  }
  return { request, handleResponse };
})();

const handlers = {
  socket: handleSocket,
  response: handleResponse,
};

self.addEventListener('message', ({ data }) => {
  const handler = handlers[data.type];
  if (!handler) {
    // TODO: Log
    return;
  }
  handler(data.body || {});
});

const store = new GameStore();
store.connect(socket);

/**
 * pasta global object
 *
 * consumed by core modules
 */
self.$pasta = {} as PastaContext;

self.$pasta.api = createAdapter({
  [Protocol.IO]: (apiName, payload) => {
    return request(apiName, payload);
  },
  [Protocol.HTTP]: () => {
  },
});

self.$pasta.store = store;

self.$pasta.log = function (msg) {
  console.log(msg);
};

/////////////////////////////////////////////////////////////////////////
// Loop
/////////////////////////////////////////////////////////////////////////

var time;
function update() {
  setTimeout(update, 10);

  const now = new Date().getTime();
  const dt = now - (time || now);
  time = now;

  // Update store
  store.update(dt);
}
update();
