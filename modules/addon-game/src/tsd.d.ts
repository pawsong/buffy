/// <reference path="../node_modules/axios/axios.d.ts"/>

declare module 'shader-particle-engine/build/SPE' {
  const s: any;
  module s {}
  export = s;
}

interface Window {
  THREE;
}

declare const NPM_PACKAGE_NAME: string;
declare const CONFIG_GAME_SERVER_URL: string;
