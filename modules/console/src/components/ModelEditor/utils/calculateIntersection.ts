import { Position } from '../types';

function calculateIntersection(destShape: Position, srcShape: Position, offset: Position) {
  let srcOffsetX, srcOffsetY, srcOffsetZ;
  let destOffsetX, destOffsetY, destOffsetZ;
  let width, height, depth;

  if (offset[0] > 0) {
    srcOffsetX = 0;
    destOffsetX = offset[0];
    width = Math.min(srcShape[0], destShape[0] - destOffsetX);
  } else {
    srcOffsetX = -offset[0];
    destOffsetX = 0;
    width = Math.min(srcShape[0] - srcOffsetX, destShape[0]);
  }

  if (offset[1] > 0) {
    srcOffsetY = 0;
    destOffsetY = offset[1];
    height = Math.min(srcShape[1], destShape[1] - destOffsetY);
  } else {
    srcOffsetY = -offset[1];
    destOffsetY = 0;
    height = Math.min(srcShape[1] - srcOffsetY, destShape[1]);
  }

  if (offset[2] > 0) {
    srcOffsetZ = 0;
    destOffsetZ = offset[2];
    depth = Math.min(srcShape[2], destShape[2] - destOffsetZ);
  } else {
    srcOffsetZ = -offset[2];
    destOffsetZ = 0;
    depth = Math.min(srcShape[2] - srcOffsetZ, destShape[2]);
  }

  return {
    srcOffset: [srcOffsetX, srcOffsetY, srcOffsetZ],
    destOffset: [destOffsetX, destOffsetY, destOffsetZ],
    shape: [width, height, depth],
  };
}

export default calculateIntersection;
