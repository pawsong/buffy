import { Ndarray } from 'ndarray';
const cwise = require('cwise');

interface TroveMap {
  (dest: Ndarray, src: Ndarray, defaultValue: number): void;
}

export default <TroveMap>cwise({
  args: ['array', 'array', 'scalar'],
  body: new Function('d', 's', 'v', `
    if (!s) {
      d = 0;
    } else if (s === 0x01ff00ff) {
      d = 0x01ff00ff;
    } else {
      d = d || v;
    }
  `),
});
