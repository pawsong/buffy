import { Action } from '../actions';

import { ApiCallSpec, ApiCallOptions, ApiCallIdAndOptions } from './core';

export interface ApiActionWithOptions {
  callId: string,
  options: ApiCallOptions,
}

export const REFERENCE_CALL: 'api/REFERENCE_CALL' = 'api/REFERENCE_CALL';
export interface ReferenceCallAction extends Action<typeof REFERENCE_CALL> {
  callId: string;
  options: ApiCallOptions;
}
export function referenceCall(callId: string, options: ApiCallOptions): ReferenceCallAction {
  return {
    type: REFERENCE_CALL,
    callId,
    options
  };
}

export const UNREFERENCE_CALL: 'api/UNREFERENCE_CALL' = 'api/UNREFERENCE_CALL';
export interface UnreferenceCallAction extends Action<typeof UNREFERENCE_CALL> {
  callIds: string[];
}
export function unreferenceCall(callIds: string[]): UnreferenceCallAction {
  return {
    type: UNREFERENCE_CALL,
    callIds,
  };
}

export const REQUEST_CALL: 'api/REQUEST_CALL' = 'api/REQUEST_CALL';
export interface RequestCallAction extends Action<typeof REQUEST_CALL> {
  callId: string;
}
export function requestCall(callId: string): RequestCallAction {
  return {
    type: REQUEST_CALL,
    callId,
  };
}

export const API_REQUEST: 'api/API_REQUEST' = 'api/API_REQUEST';
export interface ApiRequestAction extends Action<typeof API_REQUEST> {
  callId: string;
}

export const API_SUCCESS: 'api/API_SUCCESS' = 'api/API_SUCCESS';
export interface ApiSuccessAction extends Action<typeof API_SUCCESS> {
  callId: string;
  result: any;
}

export const API_FAILURE: 'api/API_FAILURE' = 'api/API_FAILURE';
export interface ApiFailureAction extends Action<typeof API_FAILURE> {
  callId: string;
  error: string;
}

export const EXPIRE_PRELOAD: 'api/EXPIRE_PRELOAD' = 'api/EXPIRE_PRELOAD';
