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

declare const BUILD_DIR: string;
