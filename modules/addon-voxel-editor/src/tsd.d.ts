/// <reference path="../node_modules/immutable/dist/immutable.d.ts" />

declare module THREE {
  export function OrbitControls(object: any, domElement: any): void;
}

declare module 'ndarray' {

  function ndarray(data: any, shape?: any, stride?: any, offset?: any): ndarray.Ndarray;
  module ndarray {
    interface Ndarray {
      data: any;
      shape: any;
      stride: any;
      offset: any;
      set(...args): any;
    }   
  }
  
  export = ndarray;
}

declare module 'store' {
  module store { 
    export function set(key: string, value: any): any;
    export function get(key: string): any;
    export function remove(key: string): void;
    export function clear(): void;
    export let enabled: boolean;
    export let disabled: boolean;
    export function transact(key: string, defaultValue: any, transactionFn?: (val: any) => void): void;
    export function getAll(): any;
    export function serialize(value: any): string;
    export function deserialize(value: string): any;
  }
  export = store;
}

declare module 'react-dnd-html5-backend' {
  const HTML5Backend: any;
  module HTML5Backend {}
  export = HTML5Backend;
}

declare module 'react-color' {
  const ColorPicker: any;
  module ColorPicker {}
  export = ColorPicker;
}

declare interface PromiseConstructor {
  using: any;
}

declare interface Promise<T> extends PromiseLike<T>, Promise.Inspection<T> {
  disposer: any;
}
