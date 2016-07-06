import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Set all elements to given scalar value.
 */

interface Set {
  (dest: Ndarray, value: number): void;
}

export default <Set>cwise({
  args: ['array', 'scalar'],
  body: new Function('a', 's', `
    a = s;
  `),
});
