import * as THREE from 'three';

const DEFAULT_DEPTH = 10;

const defaultExtrudeSettings = {
  amount: DEFAULT_DEPTH,
  steps: 1,
  bevelEnabled: false,
};

class CurvedArrowGeometry extends THREE.ExtrudeGeometry {
  constructor(size: number, lineWidth: number, headSize: number = 1.3, angle: number = Math.PI / 4, extrudeSettings?: any) {
    const finalExtrudeSettings = Object.assign({}, defaultExtrudeSettings, extrudeSettings);

    const lineWidthHalf = lineWidth / 2;

    const oRadius = size - lineWidth * headSize;
    const radius = oRadius - lineWidthHalf;
    const iRadius = oRadius - lineWidth;

    const shape = new THREE.Shape();
    shape.moveTo(
      oRadius - oRadius * Math.cos(angle),
      oRadius * Math.sin(angle)
    );
    shape.quadraticCurveTo(
      oRadius - oRadius * Math.tan(angle / 2),
      oRadius,
      oRadius, oRadius
    );
    shape.moveTo(oRadius, radius + lineWidth * headSize);
    shape.moveTo(size, radius);
    shape.moveTo(oRadius, radius - lineWidth * headSize);
    shape.moveTo(oRadius, iRadius);
    shape.quadraticCurveTo(
      oRadius - iRadius * Math.tan(angle / 2),
      iRadius,
      oRadius - iRadius * Math.cos(angle),
      iRadius * Math.sin(angle)
    );

    super(shape, finalExtrudeSettings);

    const width = oRadius;
    const height = oRadius;

    this.translate(- width / 2, - height / 2, - finalExtrudeSettings.amount / 2);
  }
}

const bidirectionalArrowExtrudeSettings = {
  amount: 1,
  steps: 1,
  bevelEnabled: false,
};

const lineShape = new THREE.Shape();
lineShape.moveTo(0,   1 / 2);
lineShape.moveTo(1,   1 / 2);
lineShape.moveTo(1, - 1 / 2);
lineShape.moveTo(0, - 1 / 2);

const lineGeometry = lineShape.extrude(bidirectionalArrowExtrudeSettings);
lineGeometry.translate(- 1 / 2, 0, - bidirectionalArrowExtrudeSettings.amount / 2);

const arrowShape = new THREE.Shape();
arrowShape.moveTo(0,   0);
arrowShape.moveTo(1,   1);
arrowShape.moveTo(1, - 1);

const arrowGeometry = arrowShape.extrude(bidirectionalArrowExtrudeSettings);
arrowGeometry.translate(0, 0, - bidirectionalArrowExtrudeSettings.amount / 2);

class BidirectionalArrow extends THREE.Object3D {
  lineWidth: number;
  headSize: number;

  leftArrow: THREE.Mesh;
  rightArrow: THREE.Mesh;
  line: THREE.Mesh;

  private depth: number;

  constructor(material: THREE.Material, lineWidth: number, headSize: number = 1.3, depth: number = DEFAULT_DEPTH) {
    super();

    this.lineWidth = lineWidth;
    this.headSize = headSize;
    this.depth = depth;

    this.leftArrow = new THREE.Mesh(arrowGeometry, material);
    this.leftArrow.scale.set(lineWidth * headSize, lineWidth * headSize, this.depth);
    this.add(this.leftArrow);

    this.rightArrow = new THREE.Mesh(arrowGeometry, material);
    this.rightArrow.scale.set(lineWidth * headSize, lineWidth * headSize, this.depth);
    this.rightArrow.rotation.set(0, Math.PI, 0);
    this.add(this.rightArrow);

    this.line = new THREE.Mesh(lineGeometry, material);
    this.add(this.line );
  }

  setLength(size: number) {
    this.leftArrow.position.set(- size / 2, 0, 0);
    this.rightArrow.position.set(size /2, 0, 0);
    this.line.scale.set(size - 2 * this.lineWidth * this.headSize, this.lineWidth, this.depth);
  }
}

export {
  CurvedArrowGeometry,
  BidirectionalArrow,
}
