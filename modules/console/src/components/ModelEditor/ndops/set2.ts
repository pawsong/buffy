import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Set all elements to given scalar value.
 */

interface Set2 {
  (dest: Ndarray, value: number): boolean;
}

export default <Set2>cwise({
  args: ['array', 'scalar'],
  pre: function() {
    this.hit = false;
  },
  body: function(a, s) {
    if (a !== s) {
      a = s;
      this.hit = true;
    }
  },
  post: function () {
    return this.hit;
  },
});
