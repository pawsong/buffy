import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Check if array contains any truthy value.
 */

interface Any {
  (array: Ndarray): boolean;
}

// Use new Function to keep code from being uglified.

export default <Any>cwise({
  args: ['array'],
  body: new Function('a', `
    if (a) return true;
  `),
  post: new Function(`
    return false;
  `),
});
