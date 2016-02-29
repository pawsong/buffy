import Quaternion from './Quaternion';

/**
 * Three.js Vector3 for universal javascript
 */

export interface SerializedVector3 {
  x: number;
  y: number;
  z: number;
}

class Vector3 {
  x: number;
  y: number;
  z: number;

  quaternion: Quaternion;

  constructor(data: SerializedVector3) {
    this.quaternion = new Quaternion();
    this.deserialize(data);
  }

  serialize(): SerializedVector3 {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
    };
  }

  deserialize(data: SerializedVector3) {
    this.x = data.x;
    this.y = data.y;
    this.z = data.z;
    return this;
  }

  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  }

  clone() {
    return new Vector3({
      x: this.x,
      y: this.y,
      z: this.z,
    });
  }

  add(v: Vector3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
  }

  sub(v: Vector3) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;

    return this;
  }

  multiplyScalar(scalar) {
    if (isFinite(scalar)) {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
    } else {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }
    return this;
  }

  applyAxisAngle(axis, angle) {
    this.applyQuaternion(this.quaternion.setFromAxisAngle(axis, angle));
    return this;
  };

  applyQuaternion(q: Quaternion) {
    const x = this.x;
    const y = this.y;
    const z = this.z;

    const qx = q.x;
    const qy = q.y;
    const qz = q.z;
    const qw = q.w;

    // calculate quat * vector
    const ix =  qw * x + qy * z - qz * y;
    const iy =  qw * y + qz * x - qx * z;
    const iz =  qw * z + qx * y - qy * x;
    const iw = - qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
    this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
    this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;
    return this;
  }

  divideScalar(scalar) {
    return this.multiplyScalar(1 / scalar);
  }

  dot(v: Vector3) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize() {
    return this.divideScalar(this.length());
  }

  crossVectors(a, b) {
    const ax = a.x, ay = a.y, az = a.z;
    const bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
  }
}

export default Vector3;
