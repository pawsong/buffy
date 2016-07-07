import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Exclude values in src.
 */

interface Exclude {
  (dest: Ndarray, src: Ndarray): boolean;
}

export default <Exclude>cwise({
  args: ['array', 'array'],
  pre: new Function(`
    this.hit = false;
  `),
  body: new Function('d', 's', `
    if (s && d) {
      d = 0;
      this.hit = true;
    }
  `),
  post: new Function(`
    return this.hit;
  `),
});
