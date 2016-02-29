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

  constructor(options: SerializedVector3) {
    this.x = options.x;
    this.y = options.y;
    this.z = options.z;
  }

  serialize(): SerializedVector3 {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
    };
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

	divideScalar(scalar) {
		return this.multiplyScalar(1 / scalar);
	}

	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}

	normalize() {
		return this.divideScalar(this.length());
	}
}

export default Vector3;
