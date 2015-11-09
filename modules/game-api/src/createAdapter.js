import { Protocol } from './Constants';
import ApiSchema from './ApiSchema';

export default function createAdapter(handler) {
  const adapter = {};
  Object.keys(ApiSchema).forEach(apiName => {
    const { protocol, serialize } = ApiSchema[apiName];
    const handle = handler[protocol];
    if (!handle) {
      throw new Error(`Cannot find ${protocol} handler`);
    }

    adapter[apiName] = (...args) => {
      return handle(apiName, serialize(...args));
    };
  });
  return adapter;
}
