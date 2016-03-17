import { ApiOptions, ApiCallSpec } from './core';

export function get (url: string, options?: ApiOptions): ApiCallSpec {
  return new ApiCallSpec({
    method: 'get',
    url: url,
    qs: options && options.qs,
  });
}

export function post(url: string, body?: Object, options?: ApiOptions): ApiCallSpec {
  return new ApiCallSpec({
    method: 'post',
    url: url,
    body: body,
    qs: options && options.qs,
  });
}

export function put(url: string, body?: Object, options?: ApiOptions): ApiCallSpec {
  return new ApiCallSpec({
    method: 'put',
    url: url,
    body: body,
    qs: options && options.qs,
  });
}

export function del(url: string, options?: ApiOptions): ApiCallSpec {
  return new ApiCallSpec({
    method: 'delete',
    url: url,
    qs: options && options.qs,
  });
}
