import {
  Protocol,
  Access,
} from './Constants';

export default {

  /**
   * Move object to given position.
   *
   * @param x {number} x position
   * @param y {number} y position
   */
  move: {
    protocol: Protocol.IO,

    access: Access.PUBLIC,

    serialize: (objId, x, y) => {
      return { id: objId, x, y };
    },
  },

  /**
   * Play effect
   *
   * @param x {number} x position
   * @param y {number} y position
   */
  playEffect: {
    protocol: Protocol.IO,

    access: Access.PUBLIC,

    serialize: (x, y, duration) => {
      return { x, y, duration };
    },
  },

  /**
   * Play effect
   *
   * @param x {number} x position
   * @param y {number} y position
   */
  setTerrain: {
    protocol: Protocol.IO,

    access: Access.PUBLIC,

    serialize: (x, y, color) => {
      return { x, y, color };
    },
  },

}
