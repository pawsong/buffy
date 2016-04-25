import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';

import TerrainManager from './TerrainManager';
import ObjectManager from './ObjectManager';

import { createEffectManager } from './effects';

interface VrCanvasOptions {
}

// TODO Support dynamic grid size
import {
  PIXEL_NUM,
  PIXEL_UNIT,
  BOX_SIZE,
  MINI_PIXEL_SIZE,
  GRID_SIZE,
} from './Constants';

import * as handlers from './handlers';

abstract class ZoneView {
  container: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  objectManager: ObjectManager;
  terrainManager: TerrainManager;
  effectManager: any;
  resyncToStore: () => void;
  cubeGeometry: THREE.Geometry;
  cubeMaterial: THREE.Material;

  protected abstract getCamera(): THREE.Camera;
  protected abstract handleWindowResize();

  private boundHandleWindowResize: () => any;
  private frameId: number;
  private tokens: any[];

  constructor(container: HTMLElement, stateLayer: StateLayer, options: VrCanvasOptions = {}) {
    this.container = container;

    const scene = this.scene = new THREE.Scene();
    const camera = this.camera = this.getCamera();
    scene.add(camera);

    const objectManager = this.objectManager = new ObjectManager(scene);
    const terrainManager = this.terrainManager = new TerrainManager(scene);
    const effectManager = this.effectManager = createEffectManager(scene);

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
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    container.appendChild(renderer.domElement);

    camera.lookAt(scene.position);

    // /////////////////////////////////////////////////////////////////////////
    // // Add event listeners
    // /////////////////////////////////////////////////////////////////////////

    this.boundHandleWindowResize = this.handleWindowResize.bind(this);
    window.addEventListener('resize', this.boundHandleWindowResize, false);

    const resyncToStore = this.resyncToStore = () => {
    //   // Clear objects
      objectManager.removeAll();

      // Terrains
      for (let i = 1; i <= stateLayer.store.map.width; ++i) {
        for (let j = 1; j <= stateLayer.store.map.depth; ++j) {
          terrainManager.findAndUpdate(i, j, 0xffffff);
        }
      }

      stateLayer.store.map.terrains.forEach(terrain => {
        terrainManager.findAndUpdate(terrain.position.x, terrain.position.z, terrain.color);
      });

      // Objects
      stateLayer.store.map.objects.forEach(obj => {
        const object = objectManager.create(obj.id);
        object.add(new THREE.Mesh( geometry, material ));

        const { group } = object;

        group.position.x = BOX_SIZE * obj.position.x -PIXEL_UNIT;
        group.position.z = BOX_SIZE * obj.position.z -PIXEL_UNIT;
        group.position.y = PIXEL_UNIT;

        group.lookAt(new THREE.Vector3(
          group.position.x + obj.direction.x,
          group.position.y + obj.direction.y,
          group.position.z + obj.direction.z
        ));

        if (obj.mesh) {
          object.changeMesh(obj.mesh);
        }

        if (obj.id === stateLayer.store.myId) {
          camera.position.copy(group.position);
        }
      });
    }

    // // Sync view to store data
    resyncToStore();

    this.tokens = Object.keys(handlers).map(key => handlers[key](stateLayer.store.subscribe, this, stateLayer));

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

  render(dt = 0) {
    this.effectManager.update(dt);
  }

  destroy() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.boundHandleWindowResize, false);
    this.tokens.forEach(token => token.remove());

    this.terrainManager.destroy();
    this.renderer.forceContextLoss();
    this.renderer.context = null;
    this.renderer.domElement = null;
  }
}

export default ZoneView;
