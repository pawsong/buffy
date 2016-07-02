import ndarray from 'ndarray';
const invariant = require('fbjs/lib/invariant');

import {
  Axis,
} from '../types';

function getSlice(axis: Axis, position: number, array: ndarray.Ndarray): ndarray.Ndarray {
  const shape = array.shape.slice();
  shape[axis] = 1;
  const offset = position * array.stride[axis];

  return ndarray(array.data, shape, array.stride, offset);
}

export default getSlice;
