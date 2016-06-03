import * as ndarray from 'ndarray';
const cwise = require('cwise');

import ndSetWithFilter2 from './setWithFilter2';

import { Volumn } from '../types';

/**
 * Fill partial volumn in array with given value
 */

function fillWithFilter2(dest: ndarray.Ndarray, volumn: Volumn, value: number, filter: ndarray.Ndarray) {
  const offset =
    dest.stride[0] * volumn[0] +
    dest.stride[1] * volumn[1] +
    dest.stride[2] * volumn[2];

  const shape = [
    volumn[3] - volumn[0] + 1,
    volumn[4] - volumn[1] + 1,
    volumn[5] - volumn[2] + 1,
  ];

  const _dest = ndarray(dest.data, shape, dest.stride, offset);

  // Assume filter has same shape with dest
  const _filter = ndarray(filter.data, shape, filter.stride, offset);

  return ndSetWithFilter2(_dest, value, _filter);
}

export default fillWithFilter2;
