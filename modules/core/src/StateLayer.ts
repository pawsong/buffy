import { CZ, ZC } from './packet';
import { RpcResponse } from './packet/base';

import StateStore from './StateStore';

interface UpdateHandler {
  (dt: number): any;
}

export interface DestroyFunc {
  (): any;
}

export interface StateLayerOptions {
  emit: (e: string, params: any, cb?: (res: RpcResponse) => any) => void;
  listen: (e: string, handler: Function) => DestroyFunc;
  update: (onUpdate: (dt: number) => any) => DestroyFunc;
}

class StateLayer {
  options: StateLayerOptions;
  store: StateStore;
  rpc: CZ.Rpc;

  private _destroyFuncs: DestroyFunc[];

  constructor(options: StateLayerOptions, params: ZC.InitParams) {
    this.options = options;

    // Create Rpc Instance
    this.rpc = {} as CZ.Rpc;
    Object.keys(CZ.Methods).forEach(method => {
      if (CZ.Methods[method].response === false) {
        this.rpc[method] = (params) => new Promise(resolve => {
          options.emit(method, params);
          resolve();
        });
      } else {
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
      }
    });

    // Create Store Instance
    this.store = new StateStore(params);
    this._destroyFuncs = Object.keys(StateStore.Routes).map(event => {
      return options.listen(event, (params) => {
        StateStore.Routes[event](this.store, params);
      });
    });
    this._destroyFuncs.push(
      options.update((dt) => this.store.update(dt))
    );
  }

  propagate(handler) {
    let destroyFuncs = Object.keys(StateStore.Routes).map(event => {
      return this.options.listen(event, (params) => {
        handler(event, params);
      });
    });
    this._destroyFuncs = this._destroyFuncs.concat(destroyFuncs);

    return () => {
      this._destroyFuncs = this._destroyFuncs.filter(fn => {
        return destroyFuncs.indexOf(fn) === -1;
      });
      destroyFuncs.forEach(fn => fn());
      destroyFuncs = [];
    };
  }

  destroy() {
    this._destroyFuncs.forEach(fn => fn());
  }
}

export default StateLayer;
