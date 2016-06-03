import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Assign values from src to dest like Object.assign.
 */

interface Assign {
  (dest: Ndarray, src: Ndarray): void;
}

export default <Assign>cwise({
  args: ['array', 'array'],
  body: function (d, s) {
    if (s) d = s;
  }
});
