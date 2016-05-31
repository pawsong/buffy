import * as THREE from 'three';

const lineGeometry = new THREE.BufferGeometry();
lineGeometry.addAttribute( 'position', new THREE.Float32Attribute([ 0, 0, 0, 0, 1, 0 ], 3 ));

const coneGeometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
// const coneGeometry = new THREE.CylinderBufferGeometry(0, 0.5, 1, 5, 1);
coneGeometry.translate(0, - 0.5, 0);

class HandleHelper extends THREE.Object3D {
  line: THREE.Line;
  cone: THREE.Mesh;

  direction: THREE.Vector3;

  private axis: THREE.Vector3;

  constructor(
    dir: THREE.Vector3, origin: THREE.Vector3,
    length?: number, color?: number, headLength?: number, headWidth?: number
  ) {
    super();

    this.direction = new THREE.Vector3();

    this.axis = new THREE.Vector3();

		if (color === undefined) color = 0xffff00;
		if (length === undefined) length = 1;
		if (headLength === undefined) headLength = 0.2 * length;
		if (headWidth === undefined) headWidth = 0.2 * headLength;

		this.position.copy(origin);

		this.line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color }));
		this.line.matrixAutoUpdate = false;
		this.add(this.line);

		this.cone = new THREE.Mesh(coneGeometry, new THREE.MeshBasicMaterial({ color }));
		this.cone.matrixAutoUpdate = false;
		this.add(this.cone);

		this.setDirection(dir);
		this.setLength(length, headLength, headWidth);
  }

  setDirection(dir: THREE.Vector3) {
    // dir is assumed to be normalized

    if (dir.y > 0.99999) {
      this.quaternion.set(0, 0, 0, 1);
    } else if (dir.y < - 0.99999) {
      this.quaternion.set(1, 0, 0, 0);
    } else {
      this.axis.set(dir.z, 0, -dir.x).normalize();
      const radians = Math.acos(dir.y);
      this.quaternion.setFromAxisAngle(this.axis, radians);
    }

    this.direction.copy(dir);
  }

  setLength(length: number, headLength?: number, headWidth?: number) {
    if (headLength === undefined) headLength = 0.2 * length;
    if (headWidth === undefined) headWidth = 0.2 * headLength;

    this.line.scale.set(1, Math.max( 0, length - headLength ), 1);
    this.line.updateMatrix();

    this.cone.scale.set(headWidth, headLength, headWidth);
    this.cone.position.y = length;
    this.cone.updateMatrix();
  }

  setColor(color: THREE.Color) {
    (<THREE.LineBasicMaterial>this.line.material).color.copy(color);
    (<THREE.MeshBasicMaterial>this.cone.material).color.copy(color);
  }
}

export default HandleHelper;
