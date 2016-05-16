import * as ndarray from 'ndarray';
import * as Immutable from 'immutable';

import { Position } from '../types';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../constants/Pixels';

export function rgbToHex({ r, g, b }) {
  return (1 << 24) /* Used by mesher */ | (r << 16) | (g << 8) | b;
}

export function toAbsPos(screenPos: Position): Position {
  return [
    GRID_SIZE / 2 + (screenPos[0] + UNIT_PIXEL) / BOX_SIZE,
    (screenPos[1] - PLANE_Y_OFFSET + UNIT_PIXEL) / BOX_SIZE,
    GRID_SIZE / 2 + (screenPos[2] + UNIT_PIXEL) / BOX_SIZE,
  ];
}

export function toScreenPos(absPos: Position): Position {
  return [
    absPos[0] * BOX_SIZE - UNIT_PIXEL - GRID_SIZE / 2 * BOX_SIZE,
    absPos[1] * BOX_SIZE - UNIT_PIXEL + PLANE_Y_OFFSET,
    absPos[2] * BOX_SIZE - UNIT_PIXEL - GRID_SIZE / 2 * BOX_SIZE,
  ];
}
