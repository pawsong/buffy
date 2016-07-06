import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Assign values that passes filter from src to dest.
 */

interface FilterAndCopy {
  (dest: Ndarray, src: Ndarray, filter: Ndarray): void;
}

export default <FilterAndCopy>cwise({
  args: ['array', 'array', 'array'],
  body: new Function('d', 's', 'f', `
    if (f) d = s;
  `),
});
