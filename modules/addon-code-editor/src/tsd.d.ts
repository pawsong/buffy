/// <reference path="../node_modules/axios/axios.d.ts"/>

interface PromiseConstructor {
  config: any;
}

interface PastaContext {
  stateLayer: any;
  log: (msg: any) => void;
}

interface WorkerGlobalScope extends EventTarget {
  postMessage: any;
  importScripts: any;
  $pasta: PastaContext;
}

interface Event {
  data: any;
}

declare const CONFIG_API_SERVER_URL: string;
declare const NPM_PACKAGE_NAME: string;
declare const BUILD_DIR: string;
