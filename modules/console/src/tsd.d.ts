/// <reference path="../node_modules/axios/axios.d.ts"/>

interface PromiseConstructor {
  config: any;
}

declare const CONFIG_DOMAIN: string;
declare const CONFIG_GAME_SERVER_URL: string;
declare const CONFIG_FACEBOOK_APP_ID: string;
declare const CONFIG_AUTH_SERVER_URL: string;

interface PastaContext {
  api: any;
  store: any;
  log: (msg: any) => void;
}

declare module NodeJS {
  interface Global {
    navigator: any;
  }
}

interface Window {
  __ready: () => void;
  $pasta: PastaContext;
  __INITIAL_STATE__: {};
}

declare module 'hairdresser' {
  const Hairdresser: any;
  module Hairdresser {}
  export = Hairdresser;
}

declare namespace __MaterialUI {
   import React = __React;
   namespace Menus {
     interface MenuItemProps extends React.Props<MenuItem> {
        onClick?: React.MouseEventHandler;
     }
   }
}
