import THREE from 'three';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';

import Canvas from '../Canvas';
import GeometryFactory from '../GeometryFactory';
import TroveGeometryFactory from '../TroveGeometryFactory';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../Constants';

import {
  ModelFileType,
  MaterialMapType,
} from '../../types';

import getTroveMaterial from '../../components/ModelEditor/canvas/materials/getTroveMaterial';
import { FileState, VoxelData } from '../../components/ModelEditor/types';

import SimpleComponent from '../../libs/SimpleComponent';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/controls/OrbitControls');
}

const unitZ = new THREE.Vector3(0, 0, 1);

const THUMBNAIL_SIZE = 256;
const radius = 40, theta = 135, phi = 30;

type ComponentProps = VoxelData;

interface ComponentTree {
  geometry: THREE.Geometry;
  material: THREE.Material;
}

class ModelViewerCanvasComponent extends SimpleComponent<ComponentProps, void, ComponentTree> {
  mesh: THREE.Mesh;
  private emptyMesh: THREE.Mesh;

  constructor(private canvas: ModelViewerCanvas) {
    super();
    this.emptyMesh = new THREE.Mesh();
    this.emptyMesh.visible = false;
    this.mesh = this.emptyMesh;
  }

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        geometry: { type: SchemaType.ANY },
        material: { type: SchemaType.ANY },
      },
    };
  }

  render() {
    const { type, maps } = this.props;

    switch(type) {
      case ModelFileType.DEFAULT: {
        const geometryFactory = new GeometryFactory();
        const geometry = geometryFactory.getGeometry(maps[MaterialMapType.DEFAULT]);
        const material = new THREE.MeshLambertMaterial({
          color: 0xffffff,
          vertexColors: THREE.VertexColors,
        }) as THREE.Material;

        return { geometry, material };
      }
      case ModelFileType.TROVE: {
        const geometryFactory = new TroveGeometryFactory();
        const geometry = geometryFactory.getGeometry(
          maps[MaterialMapType.DEFAULT],
          maps[MaterialMapType.TROVE_TYPE],
          maps[MaterialMapType.TROVE_ALPHA],
          maps[MaterialMapType.TROVE_SPECULAR]
        );
        const material = getTroveMaterial(false) as THREE.Material;

        return { geometry, material };
      }
    }

    return null;
  }

  patch(diff: ComponentTree) {
    if (this.mesh.visible) {
      this.canvas.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = this.emptyMesh;
    }

    const geometry = this.tree.geometry.clone();
    geometry.computeBoundingBox();
    geometry.translate(
      - 0.5 * (geometry.boundingBox.min.x + geometry.boundingBox.max.x),
      - 0.5 * (geometry.boundingBox.min.y + geometry.boundingBox.max.y),
      - 0.5 * (geometry.boundingBox.min.z + geometry.boundingBox.max.z)
    );

    this.mesh = new THREE.Mesh(geometry, this.tree.material);
    this.canvas.scene.add(this.mesh);
  }
}

class ModelViewerCanvas extends Canvas {
  fileState: FileState;
  camera: THREE.PerspectiveCamera;
  controls: any;
  component: ModelViewerCanvasComponent;

  private frameId: number;

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

    this.component = new ModelViewerCanvasComponent(this);
    this.component.start(this.fileState.present.data);

    this.initMesh();

		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableKeys = false;
    this.controls.addEventListener('change', () => {
      this.syncLightToCamera();
      this.render();
    });

    this.onWindowResize();
    this.syncLightToCamera();
    this.render();
  }

  initMesh() {
    if (!this.component.mesh) return;

    this.component.mesh.position.set(0, 0, 0);
    this.component.mesh.scale.set(1, 1, 1);
    this.component.mesh.lookAt(unitZ);
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

  private syncLightToCamera() {
    this.light.position.copy(this.camera.position);
    this.light.lookAt(this.controls.target);
  }

  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.render();
  }

  onStateChange(nextState: FileState) {
    this.component.updateProps(nextState.present.data);
    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  private animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    this.render();
  }

  startAnimation() {
    this.animate();
  }

  stopAnimation() {
    cancelAnimationFrame(this.frameId);
  }

  destroy() {
    this.stopAnimation();

    super.destroy();
  }

  /* Custom APIs for handling 3D model */
  rotate(angle: number) {
    this.component.mesh.rotateY(angle);
  }

  rotateLeft(angle: number) {
    this.component.mesh.rotateY(angle);
  }

  scaleX(value: number) {
    this.component.mesh.scale.setX(value);
  }

  scaleY(value: number) {
    this.component.mesh.scale.setY(value);
  }

  scaleZ(value: number) {
    this.component.mesh.scale.setZ(value);
  }

  moveX(value: number) {
    this.component.mesh.position.setX(value);
  }

  moveY(value: number) {
    this.component.mesh.position.setY(value);
  }

  moveForward = (() => {
    const matrix = new THREE.Matrix4();
    const direction = new THREE.Vector3();

    return (value: number) => {
      matrix.extractRotation(this.component.mesh.matrix);
      direction.set(0, 0, 1);
      direction.applyMatrix4(matrix);
      this.component.mesh.position.add(direction.multiplyScalar(value));
    };
  })();

  moveLocal = (() => {
    const matrix = new THREE.Matrix4();
    const direction = new THREE.Vector3();

    return (dir: [number, number, number], value: number) => {
      matrix.extractRotation(this.component.mesh.matrix);
      direction.set(dir[0], dir[1], dir[2]);
      direction.applyMatrix4(matrix);
      this.component.mesh.position.add(direction.multiplyScalar(value));
    };
  })();
}

export default ModelViewerCanvas;
