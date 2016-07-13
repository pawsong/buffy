import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Assign values from src to dest like Object.assign.
 */

interface AssignWithDefault2 {
  (dest: Ndarray, src: Ndarray, defaultMap: Ndarray, defaultValue: number): boolean;
}

// Use new Function to keep code from being uglified.

export default <AssignWithDefault2>cwise({
  args: ['array', 'array', 'array', 'scalar'],
  pre: new Function(`
    this.hit = false;
  `),
  body: new Function('d', 's', 'dm', 'dv', `
    if (s) {
      d = s;
      this.hit = true;
    } else if (dm) {
      d = dv;
      this.hit = true;
    }
  `),
  post: new Function(`
    return this.hit;
  `),
});
