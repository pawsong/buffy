import * as conf from '@pasta/config';

export const authServerUrl = __DEV__
  ? `http://localhost:${conf.apiServerPort}`
  : conf.apiServerUrl;
