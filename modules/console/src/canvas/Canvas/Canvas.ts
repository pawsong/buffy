import * as THREE from 'three';
import GameObject from '@pasta/core/lib/classes/GameObject';

// TODO Support dynamic grid size
import {
  PIXEL_SCALE,
} from '../Constants';

abstract class Canvas {
  container: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  cubeGeometry: THREE.Geometry;
  cubeMaterial: THREE.Material;

  private boundOnWindowResize: () => any;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  init() {
    const scene = this.scene = new THREE.Scene();

    // Cubes
    const geometry = this.cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.scale(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);

    const material = this.cubeMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      overdraw: 0.5,
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0x888888);
    scene.add(ambientLight);

    const renderer = this.renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.shadowMap.enabled = true;

    // Eliminate ghost bottom margin
    renderer.domElement.style.verticalAlign = 'bottom';

    this.container.appendChild(renderer.domElement);

    const camera = this.camera = this.initCamera();
    camera.lookAt(scene.position);

    // /////////////////////////////////////////////////////////////////////////
    // // Add event listeners
    // /////////////////////////////////////////////////////////////////////////

    this.boundOnWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.boundOnWindowResize, false);

    // // Sync view to store data

    // /////////////////////////////////////////////////////////////////////////
    // // FIN
    // /////////////////////////////////////////////////////////////////////////
  }

  resize() {
    this.boundOnWindowResize();
  }

  protected abstract initCamera(): THREE.Camera;
  protected abstract onWindowResize();
  abstract render();

  destroy() {
    window.removeEventListener('resize', this.boundOnWindowResize, false);

    // Dispose webgl resources
    // Check for ie and edge, which do not support WEBGL_lose_context.
    const supportLoseContext = !!this.renderer.extensions.get('WEBGL_lose_context');
    if (supportLoseContext) this.renderer.forceContextLoss();

    this.renderer.context = null;
    this.renderer.domElement = null;
  }
}

export default Canvas;
