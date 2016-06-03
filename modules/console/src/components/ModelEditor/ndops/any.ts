import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Check if array contains any truthy value.
 */

interface Any {
  (array: Ndarray): boolean;
}

export default <Any>cwise({
  args: ['array'],
  body: function(a) {
    if (a) return true;
  },
  post: function() {
    return false
  },
});
