import { Action } from './';

export enum LoginType {
  Local, Facebook,
}

export const DELETE_TOKEN: 'auth/DELETE_TOKEN' = 'auth/DELETE_TOKEN';

export const REQUEST_LOGIN: 'auth/REQUEST_LOGIN' = 'auth/REQUEST_LOGIN';
export interface RequestLoginAction extends Action<typeof REQUEST_LOGIN> {
  loginType: LoginType;
  email?: string;
  password?: string;
}

export function requestLocalLogin(email: string, password: string): RequestLoginAction {
  return {
    type: REQUEST_LOGIN,
    loginType: LoginType.Local,
    email,
    password,
  };
}

export function requestFacebookLogin(): RequestLoginAction {
  return {
    type: REQUEST_LOGIN,
    loginType: LoginType.Facebook,
  };
}

export const LOGIN_SUCCEEDED: 'auth/LOGIN_SUCCEEDED' = 'auth/LOGIN_SUCCEEDED';
export interface LoginSucceededAction extends Action<typeof LOGIN_SUCCEEDED> {
  userid: string;
  username: string;
  token?: string;
}

export const LOGIN_FAILED: 'auth/LOGIN_FAILED' = 'auth/LOGIN_FAILED';
export interface LoginFailedAction extends Action<typeof LOGIN_FAILED> {
}

export const LOGIN_ERROR: 'auth/LOGIN_ERROR' = 'auth/LOGIN_ERROR';
export interface LoginErrorAction extends Action<typeof LOGIN_ERROR> {
  loginType: LoginType;
  error: Error;
}

export const REQUEST_LOGOUT: 'auth/REQUEST_LOGOUT' = 'auth/REQUEST_LOGOUT';
export interface RequestLogoutAction extends Action<typeof REQUEST_LOGOUT> {
}

export function requestLogout(): RequestLogoutAction {
  return {
    type: REQUEST_LOGOUT,
  };
}

export const LOGOUT_SUCCEEDED: 'auth/LOGOUT_SUCCEEDED' = 'auth/LOGOUT_SUCCEEDED';
export interface LogoutSucceededAction extends Action<typeof LOGOUT_SUCCEEDED> {
}

export const LOGOUT_ERROR: 'auth/LOGOUT_ERROR' = 'auth/LOGOUT_ERROR';
export interface LogoutErrorAction extends Action<typeof LOGOUT_ERROR> {
  error: Error;
}

export const USERNAME_UPDATE: 'auth/USERNAME_UPDATE' = 'auth/USERNAME_UPDATE';
export interface UsernameUpdateAction extends Action<typeof USERNAME_UPDATE> {
  username: string;
}
export function usernameUpdate(username: string): UsernameUpdateAction {
  return {
    type: USERNAME_UPDATE,
    username,
  };
}
