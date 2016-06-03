import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Assign values from src to dest like Object.assign.
 */

interface AssignAndMask2 {
  (dest: Ndarray, mask: Ndarray, src: Ndarray): boolean;
}

export default <AssignAndMask2>cwise({
  args: ['array', 'array', 'array'],
  pre: function () {
    this.hit = false;
  },
  body: function (d, m, s) {
    if (s) {
      d = s;
      m = 1;
      this.hit = true;
    }
  },
  post: function () {
    return this.hit;
  },
});
