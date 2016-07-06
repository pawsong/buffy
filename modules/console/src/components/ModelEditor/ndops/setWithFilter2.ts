import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Set all elements to given scalar value.
 */

interface SetWithFilter2 {
  (dest: Ndarray, value: number, filter: Ndarray): boolean;
}

export default <SetWithFilter2>cwise({
  args: ['array', 'scalar', 'array'],
  pre: new Function(`
    this.hit = false;
  `),
  body: new Function('a', 's', 'f', `
    if (f) {
      a = s;
      this.hit = true;
    }
  `),
  post: new Function(`
    return this.hit;
  `),
});
