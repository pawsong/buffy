/// <reference path="../node_modules/axios/axios.d.ts"/>
/// <reference path="../node_modules/immutable/dist/immutable.d.ts"/>
/// <reference path="./typings/object-assign/object-assign.d.ts" />
/// <reference path="./typings/redux-saga/redux-saga.d.ts" />
/// <reference path="./typings/react-router-redux/react-router-redux.d.ts" />

declare const __DEV__: boolean;
declare const __CLIENT__: boolean;

declare const CONFIG_DOMAIN: string;
declare const CONFIG_GAME_SERVER_URL: string;
declare const CONFIG_API_SERVER_URL: string;
declare const CONFIG_FACEBOOK_APP_ID: string;

declare module 'http-proxy' {
  const m: any;
  module m {}
  export = m;
}

declare module 'scriptjs' {
  const m: any;
  module m {}
  export = m;
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

interface NodeRequire {
  ensure: (paths: string[], callback: (require: <T>(path: string) => T) => void) => void;
}

interface NodeModule {
  hot: any;
}

declare module THREE {
  export function OrbitControls(object: any, domElement: any): void;
}

declare namespace __MaterialUI {
  interface RaisedButtonProps {
    containerElement?: React.ReactElement<any>;
  }
}
// declare var require: {
//     // <T>(path: string): T;
//     // (paths: string[], callback: (...modules: any[]) => void): void;
//     ensure: (paths: string[], callback: (require: <T>(path: string) => T) => void) => void;
// };

