const isObject = require('lodash/isObject');
const isArray = require('lodash/isArray');
const isPlainObject = require('lodash/isPlainObject');

function stringify(data: any) {
  if (isObject(data)) {
    if (isPlainObject(data)) {
      return `{${Object.keys(data).map(key => stringify(data[key] + ','))}}`;
    } else if (isArray(data)) {
      return `[${data.map(item => stringify(item) + ',')}]`;
    } else {
      throw new Error(`Data cannot be converted to string: ${data}`);
    }
  } else {
    return `${data}`;
  }
}

export interface ApiCallOptions {
  method: 'get' | 'post' | 'put' | 'delete';
  url: string;
  qs?: Object;
  body?: Object;
}

export interface ApiCallIdAndOptions {
  id: string;
  options: ApiCallOptions;
}

export class ApiCallSpec implements ApiCallIdAndOptions {
  static serialize(options: ApiCallOptions): string {
    return [
      `m=${options.method}`,
      `u=${options.url}`,
      `q=${options.qs ? stringify(options.qs) : ''}`,
      `b=${options.body ? stringify(options.body) : ''}`,
    ].join(';');
  }

  options: ApiCallOptions;
  private _id: string;

  constructor(options: ApiCallOptions) {
    this.options = options;
  }

  get id() {
    if (this._id) { return this._id }
    this._id = ApiCallSpec.serialize(this.options);
    return this._id;
  }

  toString() {
    return this.id;
  }
}

export interface ApiOptions {
  qs: Object;
}

export interface ApiMethods<T> {
  get: (url: string, options?: ApiOptions) => T;
  post: (url: string, body?: Object, options?: ApiOptions) => T;
  put: (url: string, body?: Object, options?: ApiOptions) => T;
  delete: (url: string, options?: ApiOptions) => T;
}

export const ApiCallSpecFactory: ApiMethods<ApiCallSpec> = {
  get(url: string, options: ApiOptions): ApiCallSpec {
    return new ApiCallSpec({
      method: 'get',
      url: url,
      qs: options && options.qs,
    });
  },

  post(url: string, body?: Object, options?: ApiOptions): ApiCallSpec {
    return new ApiCallSpec({
      method: 'post',
      url: url,
      body: body,
      qs: options && options.qs,
    });
  },

  put(url: string, body?: Object, options?: ApiOptions): ApiCallSpec {
    return new ApiCallSpec({
      method: 'put',
      url: url,
      body: body,
      qs: options && options.qs,
    });
  },

  delete(url: string, options?: ApiOptions): ApiCallSpec {
    return new ApiCallSpec({
      method: 'delete',
      url: url,
      qs: options && options.qs,
    });
  },
};

type CallState = 'ready' | 'waiting' | 'pending' | 'fulfilled' | 'rejected';

export interface ApiCall<T> extends ApiCallIdAndOptions {
  state: CallState,
  result: T,
  error: string;
  refCount: number;
}

export function makeInitialApiCall(id: string, options: ApiCallOptions, state: CallState = 'waiting'): ApiCall<any> {
  return {
    id,
    options,
    state: state,
    result: null,
    error: '',
    refCount: 0,
  };
}

export interface ApiCallDictionary {
    [index: string]: ApiCall<any>;
}

export interface ApiSpecDictionary {
    [index: string]: ApiCallSpec;
}

export function compareOptions(cur: ApiCall<any>, next: ApiCall<any>) {
  return cur.id !== next.id;
}
