import * as Promise from 'bluebird';
import StateLayer from '@pasta/core/lib/StateLayer';
import { ApiContext } from './base';

import alert from './api/alert';
import boom from './api/boom';
import getFloorColor from './api/getFloorColor';
import moveForward from './api/moveForward';
import rotate from './api/rotate';
import wait from './api/wait';

const apiRegistry = {
  alert,
  boom,
  getFloorColor,
  moveForward,
  rotate,
  wait,
};

export function inject(interpreter, scope, context: ApiContext, onAsyncDone: Function) {
  Object.keys(apiRegistry).forEach(name => {
    const { async, api } = apiRegistry[name];

    const apiInst = api(context);

    if (async) {
      interpreter.setProperty(scope, name, interpreter.createAsyncFunction(function () {
        const argsLen = arguments.length - 1;
        const args = new Array(argsLen);
        for (let i = 0; i < argsLen; ++i) {
          args[i] = arguments[i];
        }
        const callback = arguments[argsLen];

        Promise.resolve()
          .then(() => apiInst.apply(null, args))
          .then(result => callback.call(interpreter, result))
          .then(() => onAsyncDone());
      }));
    } else {
      interpreter.setProperty(scope, name, interpreter.createNativeFunction(apiInst));
    }
  });
}
