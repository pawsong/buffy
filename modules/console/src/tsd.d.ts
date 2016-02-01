/// <reference path="../node_modules/axios/axios.d.ts"/>

interface PromiseConstructor {
  config: any;
}

declare const CONFIG_DOMAIN: string;
declare const CONFIG_GAME_SERVER_URL: string;
declare const CONFIG_FACEBOOK_APP_ID: string;
declare const CONFIG_AUTH_SERVER_URL: string;

declare module 'http-proxy' {
  const m: any;
  module m {}
  export = m;
}
