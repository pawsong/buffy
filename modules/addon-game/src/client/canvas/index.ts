import * as THREE from 'three';
import { EventSubscription } from 'fbemitter';
import { Store } from 'redux';
import Mesh from '@pasta/core/lib/classes/Mesh';
import StateLayer from '@pasta/core/lib/StateLayer';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import connectStateLayer from '@pasta/components/lib/stateLayer/connect';

import {
  PIXEL_NUM,
  PIXEL_UNIT,
  BOX_SIZE,
  MINI_PIXEL_SIZE,
  GRID_SIZE,
} from '../Constants';

import { createEffectManager } from '../effects';
import ObjectManager from './ObjectManager';
import TerrainManager from './TerrainManager';
import { Services } from './interface';
import * as handlers from './handlers';

import Fsm from './Fsm';

import * as tools from './tools';
import { ToolState } from './interface';

import { observeStore } from '../store';

export default (container: HTMLElement, stateLayer: StateLayer, store: Store) => {
  const camera = new THREE.OrthographicCamera(
    container.offsetWidth / - 2,
    container.offsetWidth / 2,
    container.offsetHeight / 2,
    container.offsetHeight / - 2,
    - GRID_SIZE, 2 * GRID_SIZE
  );
  camera.position.x = 200;
  camera.position.y = 200;
  camera.position.z = 200;

  const scene = new THREE.Scene();

  const objectManager = new ObjectManager(scene);
  const terrainManager = new TerrainManager(scene);
  const effectManager = createEffectManager(scene);

  const raycaster = new THREE.Raycaster();

  const planeGeo = new THREE.PlaneBufferGeometry( 2 * GRID_SIZE, 2 * GRID_SIZE );
  planeGeo.rotateX( - Math.PI / 2 );

  const plane = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial({
    visible: false,
  }));
  scene.add( plane );

  // Cubes
  var geometry = new THREE.BoxGeometry( BOX_SIZE, BOX_SIZE, BOX_SIZE );
  var material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    overdraw: 0.5,
  });

  // Lights
  var ambientLight = new THREE.AmbientLight( 0x10 );
  scene.add( ambientLight );

  const light = new THREE.DirectionalLight( 0xffffff );
  light.position.set(3, 7, 5);
  light.position.normalize();
  scene.add( light );

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  container.appendChild(renderer.domElement);

  camera.lookAt(scene.position);

  function render(dt = 0) {
    effectManager.update(dt);
    renderer.render(scene, camera);
  }

  /////////////////////////////////////////////////////////////////////////
  // Add event listeners
  /////////////////////////////////////////////////////////////////////////

  window.addEventListener('resize', onWindowResize, false);

  function onWindowResize() {
    camera.left = container.offsetWidth / - 2;
    camera.right = container.offsetWidth / 2;
    camera.top = container.offsetHeight / 2;
    camera.bottom = container.offsetHeight / - 2;
    camera.updateProjectionMatrix()

    renderer.setSize( container.offsetWidth, container.offsetHeight )
  }

  function resyncToStore() {
    // Clear objects
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
        group.position.x /* + 1*/,
        group.position.y,
        group.position.z
      ));

      if (obj.mesh) {
        object.changeMesh(obj.mesh);
      }

      if (obj.id === stateLayer.store.myId) {
        camera.position.copy(group.position);
      }
    });
  }

  // Sync view to store data
  resyncToStore();

  const services: Services = {
    container,
    objectManager,
    terrainManager,
    effectManager,
    camera,
    stateLayer,
    resyncToStore,
    scene,
    raycaster,
    cubeGeometry: geometry,
    cubeMaterial: material,
  };

  const tokens = Object.keys(handlers).map(key => handlers[key](stateLayer.store.subscribe, services));

  const toolsFsm = new Fsm<ToolState>();
  Object.keys(tools).forEach(toolName => toolsFsm.add(toolName, tools[toolName](services)));

  const reduxTokens = [
    observeStore(store, state => state.tool, ({ type }) => {
      toolsFsm.transition(type);
    }),
  ];

  /////////////////////////////////////////////////////////////////////////
  // FIN
  /////////////////////////////////////////////////////////////////////////

  let then = Date.now();
  let frameId = requestAnimationFrame(update);
  function update() {
    frameId = requestAnimationFrame(update);
    const now = Date.now();
    render(now - then);
    then = now;
  }

  return {
    destroy() {
      toolsFsm.destroy();
      window.removeEventListener('resize', onWindowResize, false);
      tokens.forEach(token => token.remove());
      reduxTokens.forEach(token => token.remove());
      cancelAnimationFrame(frameId);
      terrainManager.destroy();
    },
  };
}
