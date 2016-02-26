import StateLayer from '@pasta/core/lib/StateLayer';

export interface ApiContext {
  stateLayer: StateLayer;
  interpreter: any;
}

interface Api {
  (context: ApiContext): Function;
}

const registry: { [index: string]: { api: Api, async: boolean } } = {};

export function register(name: string, api: Api) {
  if (registry[name]) { throw new Error(`${name} api already exists`); }
  registry[name] = { async: false, api };
}

export function registerAsync(name: string, api: Api) {
  if (registry[name]) { throw new Error(`${name} api already exists`); }
  registry[name] = { async: true, api };
}

export function inject(interpreter, scope, context: ApiContext) {
  console.log(interpreter);
  Object.keys(registry).forEach(name => {
    const { async, api } = registry[name];

    if (async) {
      interpreter.setProperty(scope, name, interpreter.createAsyncFunction(function () {
        const argsLen = arguments.length - 1;
        const args = new Array(argsLen);
        for (let i = 0; i < argsLen; ++i) {
          args[i] = arguments[i];
        }
        const callback = arguments[argsLen];

        Promise.resolve()
          .then(() => api(context).apply(null, args))
          .then(result => callback.call(interpreter, result));
      }));
    } else {
      interpreter.setProperty(scope, name, interpreter.createNativeFunction(api(context)));
    }
  });
}
