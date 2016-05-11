import * as THREE from 'three';
import GameObject from '@pasta/core/lib/classes/GameObject';

import DesignManager from '../../DesignManager';
import TerrainManager from './TerrainManager';
import ObjectManager from './ObjectManager';

// TODO Support dynamic grid size
import {
  PIXEL_NUM,
  PIXEL_UNIT,
  BOX_SIZE,
  MINI_PIXEL_SIZE,
  GRID_SIZE,
} from '../Constants';

abstract class Canvas {
  container: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  designManager: DesignManager;
  objectManager: ObjectManager;
  terrainManager: TerrainManager;
  cubeGeometry: THREE.Geometry;
  cubeMaterial: THREE.Material;

  protected abstract initCamera(): THREE.Camera;
  protected abstract handleWindowResize();

  private boundHandleWindowResize: () => any;
  private frameId: number;

  constructor(container: HTMLElement, designManager: DesignManager) {
    this.container = container;
    this.designManager = designManager;
  }

  init() {
    const scene = this.scene = new THREE.Scene();

    const objectManager = this.objectManager = new ObjectManager(scene, this.designManager);
    const terrainManager = this.terrainManager = new TerrainManager(scene);

    const planeGeo = new THREE.PlaneBufferGeometry( 2 * GRID_SIZE, 2 * GRID_SIZE );
    planeGeo.rotateX( - Math.PI / 2 );

    const plane = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial({
      visible: false,
    }));
    scene.add( plane );

    // Cubes
    const geometry = this.cubeGeometry = new THREE.BoxGeometry( BOX_SIZE, BOX_SIZE, BOX_SIZE );
    const material = this.cubeMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      overdraw: 0.5,
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(5, 3, 4);
    light.position.normalize();
    scene.add(light);

    const renderer = this.renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Eliminate ghost bottom margin
    renderer.domElement.style.verticalAlign = 'bottom';

    this.container.appendChild(renderer.domElement);

    const camera = this.camera = this.initCamera();
    camera.lookAt(scene.position);

    // /////////////////////////////////////////////////////////////////////////
    // // Add event listeners
    // /////////////////////////////////////////////////////////////////////////

    this.boundHandleWindowResize = this.handleWindowResize.bind(this);
    window.addEventListener('resize', this.boundHandleWindowResize, false);

    // // Sync view to store data

    // /////////////////////////////////////////////////////////////////////////
    // // FIN
    // /////////////////////////////////////////////////////////////////////////

    let then = Date.now();
    const update = () => {
      this.frameId = requestAnimationFrame(update);
      const now = Date.now();
      this.render(now - then);
      then = now;
    }
    this.frameId = requestAnimationFrame(update);
  }

  resize() {
    this.boundHandleWindowResize();
  }

  render(dt = 0) {}

  destroy() {
    // Release event handlers
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.boundHandleWindowResize, false);

    // Dispose webgl resources
    this.terrainManager.destroy();
    this.renderer.forceContextLoss();
    this.renderer.context = null;
    this.renderer.domElement = null;
  }
}

export default Canvas;
