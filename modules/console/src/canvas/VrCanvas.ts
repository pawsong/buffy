import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/effects/CardboardEffect');
  require('three/examples/js/controls/DeviceOrientationControls');
}

import TerrainManager from './TerrainManager';
import ObjectManager from './ObjectManager';

import { createEffectManager } from './effects';

interface VrCanvasOptions {
  stateLayer: StateLayer;
  container: HTMLElement;
}

// TODO Support dynamic grid size
import {
  PIXEL_NUM,
  PIXEL_UNIT,
  BOX_SIZE,
  MINI_PIXEL_SIZE,
  GRID_SIZE,
} from './Constants';

import { Services } from './interface';
import * as handlers from './handlers';

class VrCanvas {
  frameId: number;
  handleWindowResize: () => any;
  tokens: any[];

  terrainManager: TerrainManager;
  renderer: THREE.WebGLRenderer;
  controls: any;

  constructor(options: VrCanvasOptions) {
    const { stateLayer, container } = options;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90, container.offsetWidth / container.offsetHeight, 0.001, 700);
    // camera.position.set(0, 15, 0);
    camera.position.set(200, 200, 200);
    camera['focalLength'] = camera.position.distanceTo( scene.position );
    scene.add(camera);

    const controls = this.controls = new THREE['DeviceOrientationControls']( camera );


    // const camera = new THREE.OrthographicCamera(
    //   container.offsetWidth / - 2,
    //   container.offsetWidth / 2,
    //   container.offsetHeight / 2,
    //   container.offsetHeight / - 2,
    //   - GRID_SIZE, 2 * GRID_SIZE
    // );
    // camera.position.x = 200;
    // camera.position.y = 200;
    // camera.position.z = 200;

    const objectManager = new ObjectManager(scene);
    const terrainManager = this.terrainManager = new TerrainManager(scene);
    const effectManager = createEffectManager(scene);

    // const raycaster = new THREE.Raycaster();
    // const cursorManager = new CursorManager(container, scene, raycaster, camera, terrainManager);

    const planeGeo = new THREE.PlaneBufferGeometry( 2 * GRID_SIZE, 2 * GRID_SIZE );
    planeGeo.rotateX( - Math.PI / 2 );

    const plane = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial({
      visible: false,
    }));
    scene.add( plane );

    // Cubes
    const geometry = new THREE.BoxGeometry( BOX_SIZE, BOX_SIZE, BOX_SIZE );
    const material = new THREE.MeshLambertMaterial({
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

    const renderer = this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    container.appendChild(renderer.domElement);

    const effect = new THREE['CardboardEffect'](renderer);

    camera.lookAt(scene.position);

    function render(dt = 0) {
      controls.update();
      effectManager.update(dt);
      // renderer.render(scene, camera);
      effect.render(scene, camera);
    }

    // /////////////////////////////////////////////////////////////////////////
    // // Add event listeners
    // /////////////////////////////////////////////////////////////////////////

    this.handleWindowResize = function handleWindowResize() {
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      effect.setSize(width, height);
    }
    window.addEventListener('resize', this.handleWindowResize, false);

    function resyncToStore() {
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

    const services: Services = {
      container,
      objectManager,
      terrainManager,
      effectManager,
      // cursorManager,
      camera,
      stateLayer,
      resyncToStore,
      scene,
      // raycaster,
      // store,
      cubeGeometry: geometry,
      cubeMaterial: material,
    };

    this.tokens = Object.keys(handlers).map(key => handlers[key](stateLayer.store.subscribe, services));

    // const toolsFsm = new Fsm<ToolState>();
    // Object.keys(tools).forEach(toolName => toolsFsm.add(toolName, tools[toolName](services)));

    // const reduxTokens = [
    //   observeStore(store, state => state.game.tool, ({ type }) => {
    //     toolsFsm.transition(type);
    //   }),
    // ];

    // /////////////////////////////////////////////////////////////////////////
    // // FIN
    // /////////////////////////////////////////////////////////////////////////

    let then = Date.now();
    const update = () => {
      this.frameId = requestAnimationFrame(update);
      const now = Date.now();
      render(now - then);
      then = now;
    }
    update();

    // return {
    //   destroy() {
    //     toolsFsm.stop();
    //     window.removeEventListener('resize', onWindowResize, false);
    //     tokens.forEach(token => token.remove());
    //     reduxTokens.forEach(token => token.remove());
    //     cancelAnimationFrame(frameId);
    //     terrainManager.destroy();
    //     cursorManager.destroy();
    //     renderer.forceContextLoss();
    //     renderer.context = null;
    //     renderer.domElement = null;
    //   },
    //   resize() {
    //     onWindowResize();
    //   },
    // };
  }

  destroy() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.handleWindowResize, false);
    this.tokens.forEach(token => token.remove());

    this.controls.dispose();

    this.terrainManager.destroy();
    this.renderer.forceContextLoss();
    this.renderer.context = null;
    this.renderer.domElement = null;
  }
}

export default VrCanvas;
