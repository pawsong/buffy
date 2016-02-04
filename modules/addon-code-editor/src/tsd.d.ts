/// <reference path="../node_modules/axios/axios.d.ts"/>

interface PromiseConstructor {
  config: any;
}

interface WorkerGlobalScope extends EventTarget {
  postMessage: any;
  importScripts: any;
  $ctx: any;
}

interface Event {
  data: any;
}


declare module 'radium' {
  const m: any;
  module m {}
  export = m;
}

declare module 'jquery.terminal' {
  const m: any;
  module m {}
  export = m;
}

declare module 'http-proxy' {
  const m: any;
  module m {}
  export = m;
}

declare const CONFIG_API_SERVER_URL: string;
declare const NPM_PACKAGE_NAME: string;
declare const BUILD_DIR: string;
