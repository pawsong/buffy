import * as Promise from 'bluebird';
import { defineAsync } from '../base';

/**
 * boom block
 */

export default defineAsync(({
  stateLayer,
}) => (secs: number) => {
  return new Promise(resolve => setTimeout(resolve, secs * 1000));
});
