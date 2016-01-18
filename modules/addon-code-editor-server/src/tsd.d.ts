/// <reference path="../node_modules/axios/axios.d.ts"/>

interface PromiseConstructor {
  config: any;
}

interface PastaContext {
  api: any;
  store: any;
  log: (msg: any) => void;
}

interface Window {
  __ready: () => void;
  $pasta: PastaContext;
  __INITIAL_STATE__: {};
}

declare const BUILD_DIR: string;
