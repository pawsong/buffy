import THREE from 'three';
import Canvas from '../../../../../canvas/Canvas';
import GeometryFactory from '../../../../../canvas/GeometryFactory';
import TroveGeometryFactory from '../../../../../canvas/TroveGeometryFactory';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../canvas/Constants';

import {
  ModelFileType,
  MaterialMapType,
} from '../../../../../types';

import getTroveMaterial from '../../../../../components/ModelEditor/canvas/materials/getTroveMaterial';
import { FileState } from '../../../../../components/ModelEditor/types';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/controls/OrbitControls');
}

const THUMBNAIL_SIZE = 256;
const radius = 80, theta = 135, phi = 30;

class ModelViewerCanvas extends Canvas {
  fileState: FileState;
  camera: THREE.PerspectiveCamera;
  controls: any;

  private light: THREE.DirectionalLight;

  constructor(container: HTMLElement, fileState: FileState) {
    super(container);
    this.fileState = fileState;
  }

  init() {
    super.init();
    this.renderer.setClearColor(0xffffff);

    this.light = new THREE.DirectionalLight(0xffffff, 0.5);

    const d = 15 * PIXEL_SCALE;
    this.light.shadow.camera['left'] = - d;
    this.light.shadow.camera['right'] = d;
    this.light.shadow.camera['top'] = d;
    this.light.shadow.camera['bottom'] = - d;
    this.light.shadow.camera['far'] = 2000;
    this.scene.add(this.light);

    const { type, maps } = this.fileState.present.data;

    let mesh: THREE.Mesh;
    switch(this.fileState.present.data.type) {
      case ModelFileType.DEFAULT: {
        const geometryFactory = new GeometryFactory();
        const geometry = geometryFactory.getGeometry(maps[MaterialMapType.DEFAULT]);
        const material = new THREE.MeshLambertMaterial({
          color: 0xffffff,
          vertexColors: THREE.VertexColors,
        });

        mesh = new THREE.Mesh(geometry, material);
        break;
      }
      case ModelFileType.TROVE: {
        const geometryFactory = new TroveGeometryFactory();
        const geometry = geometryFactory.getGeometry(
          maps[MaterialMapType.DEFAULT],
          maps[MaterialMapType.TROVE_TYPE],
          maps[MaterialMapType.TROVE_ALPHA],
          maps[MaterialMapType.TROVE_SPECULAR]
        );
        const material = getTroveMaterial(false);
        mesh = new THREE.Mesh(geometry, material);
        break;
      }
    }
    this.scene.add(mesh);

		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('change', () => {
      this.syncLightToCamera();
      this.render();
    });

    const size = mesh.geometry.boundingBox.size();
    this.controls.target.copy(size).divideScalar(2);
    this.controls.update();

    this.onWindowResize();
    this.syncLightToCamera();
    this.render();
  }

  initCamera() {
    const camera = new THREE.PerspectiveCamera(
      40, THUMBNAIL_SIZE / THUMBNAIL_SIZE, 1, 10000
    );
    camera.position.x = radius * Math.cos(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360);
    camera.position.z = radius * Math.sin(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360);
    camera.position.y = radius * Math.sin(phi * Math.PI / 360);
    camera.lookAt(this.scene.position);

    return camera;
  }

  syncLightToCamera() {
    this.light.position.copy(this.camera.position);
    this.light.lookAt(this.controls.target);
  }

  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

export default ModelViewerCanvas;
