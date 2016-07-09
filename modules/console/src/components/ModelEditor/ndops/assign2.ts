import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Assign values from src to dest like Object.assign.
 */

interface Assign {
  (dest: Ndarray, src: Ndarray): boolean;
}

// Use new Function to keep code from being uglified.

export default <Assign>cwise({
  args: ['array', 'array'],
  pre: new Function(`
    this.hit = false;
  `),
  body: new Function('d', 's', `
    if (s) {
      d = s;
      this.hit = true;
    }
  `),
  post: new Function(`
    return this.hit;
  `),
});
