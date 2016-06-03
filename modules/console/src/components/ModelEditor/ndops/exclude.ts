import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Exclude values in src.
 */

interface Exclude {
  (dest: Ndarray, src: Ndarray): void;
}

export default <Exclude>cwise({
  args: ['array', 'array'],
  body: function (d, s) {
    if (s) d = 0;
  }
});
