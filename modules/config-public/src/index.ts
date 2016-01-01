declare const process: NodeJS.Process;

let _consolePublicPath;
let _adminPublicPath;
let _gameServerUrl;
let _apiServerUrl;
let _facebookAppId;
let _domain

if (process.env.NODE_ENV !== 'production') {
  // Should be eliminated by dead-code elimination in proudction mode

  const iConfig = require('@pasta/config-internal');

  _consolePublicPath =
    `http://localhost:${iConfig.consoleWebpackAppPort}/`;

  _adminPublicPath =
    `http://localhost:${iConfig.adminWebpackAppPort}/`;

  _gameServerUrl =
    `http://localhost:${iConfig.gameServerPort}`;

  _apiServerUrl =
    `http://localhost:${iConfig.apiServerPort}`;

  _facebookAppId = '1127122043982378';
} else {

  _consolePublicPath =
    'https://pasta-prod.s3-ap-northeast-1.amazonaws.com/';

  _adminPublicPath =
    'https://pasta-admin.s3-ap-northeast-1.amazonaws.com/';

  _gameServerUrl =
    `http://zone.html5.computer`;

  _apiServerUrl =
    `http://api.html5.computer`;

  _facebookAppId = '1127121857315730';

  _domain = 'html5.computer';
}

/**
 * Console application navbar height. Should be removed from here.
 */
export const navbarHeight = 48;

export const consolePublicPath: string = _consolePublicPath;

export const adminPublicPath: string = _adminPublicPath;

export const gameServerUrl: string = _gameServerUrl;

export const apiServerUrl: string = _apiServerUrl;

export const facebookAppId: string = _facebookAppId;

export const domain: string = _domain;
