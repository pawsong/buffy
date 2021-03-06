import * as ndarray from 'ndarray';

import ndSet2 from './set2';

import { Volumn } from '../types';

/**
 * Fill partial volumn in array with given value
 */

function fill(array: ndarray.Ndarray, volumn: Volumn, value: number) {
  const offset =
    array.stride[0] * volumn[0] +
    array.stride[1] * volumn[1] +
    array.stride[2] * volumn[2];

  const shape = [
    volumn[3] - volumn[0] + 1,
    volumn[4] - volumn[1] + 1,
    volumn[5] - volumn[2] + 1,
  ];

  const _array = ndarray(array.data, shape, array.stride, offset);
  return ndSet2(_array, value);
}

export default fill;
