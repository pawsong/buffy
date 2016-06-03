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
  pre: function() {
    this.hit = false;
  },
  body: function (d, s) {
    if (s) {
      d = s;
      this.hit = true;
    }
  },
  post: function () {
    return this.hit;
  },
});
