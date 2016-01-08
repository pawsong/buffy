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

declare module 'superagent' {
  const Superagent: any;
  module Superagent {}
  export = Superagent;
}

declare namespace __MaterialUI {
   import React = __React;
   namespace Menus {
     interface MenuItemProps extends React.Props<MenuItem> {
        onClick?: React.MouseEventHandler;
     }
   }
}
