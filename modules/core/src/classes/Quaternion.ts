class Quaternion {
  _x: number;
  _y: number;
  _z: number;
  _w: number;

  constructor(x?, y?, z?, w?) {
    this._x = x || 0;
    this._y = y || 0;
    this._z = z || 0;
    this._w = ( w !== undefined ) ? w : 1;
  };

  get x () {
    return this._x;
  }

  get y () {
    return this._y;
  }

  get z () {
    return this._z;
  }

  get w () {
    return this._w;
  }

  setFromAxisAngle(axis, angle) {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
    // assumes axis is normalized

    const halfAngle = angle / 2, s = Math.sin( halfAngle );

    this._x = axis.x * s;
    this._y = axis.y * s;
    this._z = axis.z * s;
    this._w = Math.cos(halfAngle);

    return this;
  };
}

export default Quaternion;
