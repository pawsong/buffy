import { Ndarray } from 'ndarray';
const cwise = require('cwise');

/**
 * Assign values from src to dest like Object.assign.
 */

interface Count {
  (matrix: Ndarray): number;
}

// Use new Function to keep code from being uglified.

export default <Count>cwise({
  args: ['array'],
  pre: new Function(`
    this.count = 0;
  `),
  body: new Function('m', `
    if (m) { this.count += 1; }
  `),
  post: new Function(`
    return this.count;
  `),
});
