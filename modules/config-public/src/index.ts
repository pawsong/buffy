declare const process: NodeJS.Process;

export interface PastaConfig {
  consolePublicPath: string;
  adminPublicPath: string;
  gameServerUrl: string;
  apiServerUrl: string;
  facebookAppId: string;
  domain: string;
}

let config: PastaConfig;

if (process.env.NODE_ENV !== 'production') {
  // Should be eliminated by dead-code elimination in proudction mode
  config = require('./development').default;
} else {
  config = require('./production').default;
}

export default config;
