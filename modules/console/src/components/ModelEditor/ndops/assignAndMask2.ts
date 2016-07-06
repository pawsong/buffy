import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Assign values from src to dest like Object.assign.
 */

interface AssignAndMask2 {
  (dest: Ndarray, mask: Ndarray, src: Ndarray, maskVal: number): boolean;
}

export default <AssignAndMask2>cwise({
  args: ['array', 'array', 'array', 'scalar'],
  pre: new Function(`
    this.hit = false;
  `),
  body: new Function('d', 'm', 's', 'maskVal', `
    if (s) {
      d = s;
      m = maskVal;
      this.hit = true;
    }
  `),
  post: new Function(`
    return this.hit;
  `),
});
