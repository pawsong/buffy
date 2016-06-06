import { CZ, ZC } from './packet';
import { RpcResponse } from './packet/base';

import StateStore from './StateStore';
import StoreRoutes from './store/StoreRoutes';

interface UpdateHandler {
  (dt: number): any;
}

export interface DestroyFunc {
  (): any;
}

export interface StateLayerOptions {
  emit: (e: string, params: any, cb?: (res: RpcResponse) => any) => void;
  listen: (e: string, handler: Function) => DestroyFunc;
  update?: (onUpdate: (dt: number) => any) => DestroyFunc;
  store?: StateStore;
}

class StateLayer {
  options: StateLayerOptions;
  store: StateStore;
  rpc: CZ.Rpc;

  private _destroyFuncs: DestroyFunc[];

  constructor(options: StateLayerOptions, params: ZC.InitParams = null) {
    this.options = Object.assign({}, {
      update: (callback) => {
        let frameId = requestAnimationFrame(update);
        let then = Date.now();
        function update() {
          const now = Date.now();
          callback(now - then);
          then = now;
          frameId = requestAnimationFrame(update);
        }
        return () => cancelAnimationFrame(frameId);
      },
    }, options);

    // Create Rpc Instance
    this.rpc = {} as CZ.Rpc;
    CZ.Methods.forEach(method => {
      this.rpc[method] = (params) => new Promise((resolve, reject) => {
        options.emit(method, params, (res) => {
          if (res.error) {
            // TODO: Create Error instance
            reject(res.error);
          } else {
            resolve(res.result);
          }
        });
      });
    });

    // Create Store Instance
    this.store = options.store || new StateStore();
  }

  start(routes: StoreRoutes) {
    // Start listening server
    this._destroyFuncs = ZC.Events.map(event => {
      return this.options.listen(event, (params) => routes[event](params))
    });

    // Start client-side update
    this._destroyFuncs.push(
      this.options.update((dt) => this.store.update(dt))
    );
  }

  destroy() {
    if (this._destroyFuncs) this._destroyFuncs.forEach(fn => fn());
  }
}

export default StateLayer;
