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
}
