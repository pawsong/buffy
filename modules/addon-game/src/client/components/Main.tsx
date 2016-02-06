import * as React from 'react';
import * as THREE from 'three';
import { EventSubscription } from 'fbemitter';
import Mesh from '@pasta/core/lib/classes/Mesh';
import StateLayer from '@pasta/core/lib/StateLayer';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import connectStateLayer from '@pasta/helper/lib/ReactStateLayer/connect';

import { createEffectManager } from '../effects';

import ObjectManager from '../ObjectManager';
import { SmartObject } from '../ObjectManager';

import * as Promise from 'bluebird';

const PIXEL_NUM = 16;
const PIXEL_UNIT = 32;
const BOX_SIZE = PIXEL_UNIT * 2;
const MINI_PIXEL_SIZE = BOX_SIZE / PIXEL_NUM;
const GRID_SIZE = BOX_SIZE * 10;

function initMainView(container, stateLayer: StateLayer) {
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
  const effectManager = createEffectManager(scene);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const planeGeo = new THREE.PlaneBufferGeometry( 2 * GRID_SIZE, 2 * GRID_SIZE );
  planeGeo.rotateX( - Math.PI / 2 );

  const plane = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial({
    visible: false,
  }));
  scene.add( plane );

  const rollOverPlaneGeo = new THREE.PlaneBufferGeometry( BOX_SIZE, BOX_SIZE );
  rollOverPlaneGeo.rotateX( - Math.PI / 2 );
  const rollOverMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    opacity: 0.5,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -0.1,
  });
  const rollOverPlane = new THREE.Mesh( rollOverPlaneGeo, rollOverMaterial);
  scene.add( rollOverPlane );

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

  const terrains: THREE.Mesh[] = [];
  let terrainsIndexed: {
    [index: string]: THREE.Object3D;
  } = {};

  function addTerrain(x: number, z: number, terrain: THREE.Mesh) {
    const key = `${x}_${z}`;
    terrains.push(terrain);
    terrainsIndexed[key] = terrain;
  }

  function existsTerrain(x: number, z: number) {
    const key = `${x}_${z}`;
    return !!terrainsIndexed[key];
  }
  /////////////////////////////////////////////////////////////////////////
  // Add event listeners
  /////////////////////////////////////////////////////////////////////////

  function onMouseMove(event) {
    event.preventDefault();

    mouse.set(
      (event.offsetX / container.offsetWidth) * 2 - 1,
      -(event.offsetY / container.offsetHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(terrains);
    if (intersects.length === 0) { return; }

    const intersect = intersects[0];

    rollOverPlane.position.copy(intersect.point).add(intersect.face.normal);
    rollOverPlane.position
      .divideScalar(BOX_SIZE)
      .floor()
      .multiplyScalar(BOX_SIZE)
      .addScalar(PIXEL_UNIT);

    rollOverPlane.position.y = 0;

    render();
  }

  function onMouseDown(event) {
    event.preventDefault();

    const position = new THREE.Vector3();
    position.copy(rollOverPlane.position)
      .divideScalar(BOX_SIZE)
      .floor()
      .addScalar(1);

    stateLayer.rpc.move({
      id: stateLayer.store.myId,
      x: position.x,
      z: position.z,
    });
  }

  container.addEventListener('mousemove', onMouseMove, false);
  container.addEventListener('mousedown', onMouseDown, false);
  window.addEventListener('resize', onWindowResize, false);

  function onWindowResize() {
    camera.left = container.offsetWidth / - 2;
    camera.right = container.offsetWidth / 2;
    camera.top = container.offsetHeight / 2;
    camera.bottom = container.offsetHeight / - 2;
    camera.updateProjectionMatrix()

    renderer.setSize( container.offsetWidth, container.offsetHeight )
  }

  const terrainGeometry = new THREE.PlaneGeometry(BOX_SIZE, BOX_SIZE);
  terrainGeometry.rotateX( - Math.PI / 2 );
  terrainGeometry.translate( PIXEL_UNIT, 0, PIXEL_UNIT );

  function reset() {
    // Clear terrains
    terrains.forEach(terrain => {
      scene.remove(terrain);
      terrain.material.dispose();
    });
    terrains.length = 0;
    terrainsIndexed = {};

    // Clear objects
    objectManager.removeAll();
  }

  function changeObjectMesh(object: SmartObject, mesh: Mesh) {
    object.reset();

    const geometry = new THREE.Geometry();

    geometry.vertices.length = 0;
    geometry.faces.length = 0;
    for(var i = 0; i < mesh.vertices.length; ++i) {
      var q = mesh.vertices[i];
      geometry.vertices.push(new THREE.Vector3(q[0], q[1], q[2]));
    }
    for(var i = 0; i < mesh.faces.length; ++i) {
      const q = mesh.faces[i];
      const f = new THREE.Face3(q[0], q[1], q[2]);
      f.color = new THREE.Color(q[3]);
      f.vertexColors = [f.color,f.color,f.color];
      geometry.faces.push(f);
    }

    geometry.computeFaceNormals()

    geometry.verticesNeedUpdate = true
    geometry.elementsNeedUpdate = true
    geometry.normalsNeedUpdate = true

    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()

    // Create surface mesh
    var material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
    });
    const surfacemesh = new THREE.Mesh( geometry, material );
    // surfacemesh.doubleSided = false;
    surfacemesh.position.x = MINI_PIXEL_SIZE * -PIXEL_NUM / 2.0;
    surfacemesh.position.y = MINI_PIXEL_SIZE * -PIXEL_NUM / 2.0;
    surfacemesh.position.z = MINI_PIXEL_SIZE * -PIXEL_NUM / 2.0;
    surfacemesh.scale.set(MINI_PIXEL_SIZE, MINI_PIXEL_SIZE, MINI_PIXEL_SIZE);

    object.add(surfacemesh, { geometry, material });
  }

  function resyncToStore() {
    reset();

    // Terrains
    stateLayer.store.map.terrains.forEach(terrain => {
      const material = new THREE.MeshBasicMaterial({
        side: THREE.FrontSide,
        color: terrain.color,
      });
      const terrainMesh = new THREE.Mesh(terrainGeometry, material);
      terrainMesh.position.x = (terrain.position.x - 1) * BOX_SIZE;
      terrainMesh.position.z = (terrain.position.z - 1) * BOX_SIZE;
      scene.add(terrainMesh);

      addTerrain(terrain.position.x, terrain.position.z, terrainMesh);
    });

    for (let i = 1; i <= stateLayer.store.map.width; ++i) {
      for (let j = 1; j <= stateLayer.store.map.depth; ++j) {
        if (existsTerrain(i, j)) { continue; }

        const material = new THREE.MeshBasicMaterial({
          side: THREE.FrontSide,
          color: 0xffffff,
        });
        const terrainMesh = new THREE.Mesh(terrainGeometry, material);
        terrainMesh.position.x = (i - 1) * BOX_SIZE;
        terrainMesh.position.z = (j - 1) * BOX_SIZE;
        scene.add(terrainMesh);

        addTerrain(i, j, terrainMesh);
      }
    }

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
        changeObjectMesh(object, obj.mesh);
      }

      if (obj.id === stateLayer.store.myId) {
        camera.position.copy(group.position);
      }
    });
  }

  // Sync view to store data
  resyncToStore();

  const tokens: EventSubscription[] = [];
  const subscribe: StoreListen = {} as StoreListen;
  StoreEvents.forEach(method => {
    subscribe[method] = function (handler) {
      const token = stateLayer.store.subscribe[method](handler);
      tokens.push(token);
      return token;
    };
  });

  subscribe.resync(() => resyncToStore());

  subscribe.move(function (params) {
    const { group } = objectManager.find(params.object.id);

    // Rotate
    var pos = new THREE.Vector3();
    pos.x = BOX_SIZE * params.to.x - PIXEL_UNIT;
    pos.z = BOX_SIZE * params.to.z - PIXEL_UNIT;
    pos.y = group.position.y;
    group.lookAt(pos);

    // Move
    group.position.x = pos.x;
    group.position.z = pos.z;

    if (params.object.id === stateLayer.store.myId) {
      camera.position.copy(group.position);
    }
  });

  subscribe.meshUpdated(params => {
    const object = objectManager.find(params.object.id);
    changeObjectMesh(object, params.object.mesh);
  });

  subscribe.playEffect(params => {
    effectManager.create('fire', params.duration, {
      x: params.x,
      z: params.z,
    });
  });

  subscribe.objectAdded(params => {
    const { object: obj } = params;
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
      changeObjectMesh(object, obj.mesh);
    }

    if (obj.id === stateLayer.store.myId) {
      camera.position.copy(group.position);
    }
  });

  subscribe.objectRemoved(params => {
    objectManager.remove(params.id);
  });

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
      container.removeEventListener('mousemove', onMouseMove, false);
      container.removeEventListener('mousedown', onMouseDown, false);
      window.removeEventListener('resize', onWindowResize, false);
      tokens.forEach(token => token.remove());
      cancelAnimationFrame(frameId);
    },
  };
}

interface MainProps extends React.Props<Main> {
  style: Object;
  stateLayer?: StateLayer;
}

@connectStateLayer()
class Main extends React.Component<MainProps, {}> {
  // TypeScript jsx parser omits adding displayName when using decorator
  static displayName = 'Main';

  canvas;

  componentDidMount() {
    this.canvas = initMainView(this.refs['canvas'], this.props.stateLayer);
  }

  componentWillUnmount() {
    this.canvas.destroy();
  }

  render() {
    return <div style={this.props.style} ref="canvas"></div>;
  }
};

export default Main;
