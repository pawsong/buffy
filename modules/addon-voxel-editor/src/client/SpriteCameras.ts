import vector3ToString from '@pasta/helper/lib/vector3ToString';

/*
 * {
 *   front: normal vector of plane that the camera is looking at,
 *   up: camera up direction,
 *   flip: flip axis, which used in shape carving process. (optional)
 * }
 */

// x - y - z : transfrom = true
// z - y - x : transfrom = false
export default {
  // x - z
  front: {
    front: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 0, 1),
    transform: false,
  },

  back: {
    front: new THREE.Vector3(-1, 0, 0),
    up: new THREE.Vector3(0, 0, 1),
    transform: false,
  },

  // z - y
  top: {
    front: new THREE.Vector3(0, 0, 1),
    up: new THREE.Vector3(0, -1, 0),
    transform: false,
  },

  bottom: {
    front: new THREE.Vector3(0, 0, -1),
    up: new THREE.Vector3(0, 1, 0),
    transform: false,
  },

  // y - z
  left: {
    front: new THREE.Vector3(0, 1, 0),
    up: new THREE.Vector3(0, 0, 1),
    transform: true,
  },

  right: {
    front: new THREE.Vector3(0, -1, 0),
    up: new THREE.Vector3(0, 0, 1),
    transform: true,
  },
};

export function getCameraId(front, up) {
  return [front, up]
    .map(direction => vector3ToString(direction))
    .join('/');
}