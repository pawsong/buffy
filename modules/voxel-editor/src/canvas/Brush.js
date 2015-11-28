import {
  BOX_SIZE,
} from '../constants/Pixels';

const cube = new THREE.CubeGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
const brushMaterial = new THREE.MeshBasicMaterial({
  vertexColors: THREE.VertexColors,
  opacity: 0.5,
  transparent: true,
});
brushMaterial.color.setStyle('#2ECC71');

class Brush {
  constructor(scene) {
    const mesh = new THREE.Mesh(cube, brushMaterial);
    mesh.isBrush = true;
    mesh.visible = false;
    mesh.overdraw = false;
    scene.add(mesh);

    const wireMesh = new THREE.EdgesHelper(mesh, 0x000000);
    wireMesh.visible = false;
    scene.add(wireMesh);

    this._mesh = mesh;
    this._wireMesh = wireMesh;
  }

  hide() {
    this._mesh.visible = false;
    this._wireMesh.visible = false;
  }

  isVisible() {
    return this._mesh.visible;
  }

  get position() {
    return this._mesh.position;
  }

  move(position) {
    this._mesh.visible = true;
    this._wireMesh.visible = true;
    this._mesh.position.copy(position);
  }
}

export default Brush;
