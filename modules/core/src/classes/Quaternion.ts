import Vector3 from './Vector3';

const EPS = 0.000001;

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

	setFromUnitVectors(vFrom: Vector3, vTo: Vector3) {
		// http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final

		// assumes direction vectors vFrom and vTo are normalized

    // if ( v1 === undefined ) v1 = new THREE.Vector3();
    const v1 = new Vector3({ x: 0, y: 0, z: 0 });

    let r = vFrom.dot(vTo) + 1;

    if (r < EPS) {
      r = 0;
      if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) {
        v1.set(-vFrom.y, vFrom.x, 0);
      } else {
        v1.set(0, -vFrom.z, vFrom.y);
      }
    } else {
      v1.crossVectors(vFrom, vTo);
    }

    this._x = v1.x;
    this._y = v1.y;
    this._z = v1.z;
    this._w = r;

    this.normalize();

    return this;
  }

  length() {
    return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );
  }

  normalize() {
    let l = this.length();

    if ( l === 0 ) {
      this._x = 0;
      this._y = 0;
      this._z = 0;
      this._w = 1;
    } else {
      l = 1 / l;
      this._x = this._x * l;
      this._y = this._y * l;
      this._z = this._z * l;
      this._w = this._w * l;
    }

    return this;
  }
}

export default Quaternion;
