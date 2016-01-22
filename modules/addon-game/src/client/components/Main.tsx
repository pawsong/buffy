import * as React from 'react';
import * as THREE from 'three';
import StateLayer from '@pasta/addon/lib/StateLayer';

import { createEffectManager } from '../effects';

import * as Promise from 'bluebird';

const PIXEL_NUM = 16;
const PIXEL_UNIT = 32;
const BOX_SIZE = PIXEL_UNIT * 2;
const MINI_PIXEL_SIZE = BOX_SIZE / PIXEL_NUM;
const GRID_SIZE = BOX_SIZE * 10;

function initMainView(htmlElement, stateLayer: StateLayer) {
  const container = htmlElement;

  const windowWidth = htmlElement.offsetWidth;
  const windowHeight = htmlElement.offsetHeight;

  /////////////////////////////////////////////////////////////////////////
  // Init
  /////////////////////////////////////////////////////////////////////////

  const camera = new THREE.OrthographicCamera(
    windowWidth / - 2,
    windowWidth / 2,
    windowHeight / 2,
    windowHeight / - 2,
    - GRID_SIZE, 2 * GRID_SIZE
  );
  camera.position.x = 200;
  camera.position.y = 200;
  camera.position.z = 200;

  const scene = new THREE.Scene();

  const effectManager = createEffectManager(scene);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const planeGeo = new THREE.PlaneBufferGeometry( 2 * GRID_SIZE, 2 * GRID_SIZE );
  planeGeo.rotateX( - Math.PI / 2 );

  const plane = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial( { visible: false } ) );
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
  var material = new THREE.MeshLambertMaterial( { color: 0xffffff, overdraw: 0.5 } );

  // Lights

  var ambientLight = new THREE.AmbientLight( 0x10 );
  scene.add( ambientLight );

  const light = new THREE.DirectionalLight( 0xffffff );
  light.position.set(3, 7, 5);
  light.position.normalize();
  scene.add( light );

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize( htmlElement.offsetWidth, htmlElement.offsetHeight );
  htmlElement.appendChild( renderer.domElement );

  camera.lookAt( scene.position );

  function render(dt = 0) {
    effectManager.update(dt);
    renderer.render( scene, camera );
  }

  /////////////////////////////////////////////////////////////////////////
  // Add event listeners
  /////////////////////////////////////////////////////////////////////////

  function onMouseMove(event) {
    event.preventDefault();

    mouse.set( ( event.offsetX / windowWidth ) * 2 - 1,
              - ( event.offsetY / windowHeight ) * 2 + 1 );

              raycaster.setFromCamera( mouse, camera );

              const intersects = raycaster.intersectObjects(planeList);
              if (intersects.length === 0) {
                return;
              }

              const intersect = intersects[ 0 ];

              rollOverPlane.position.copy( intersect.point ).add( intersect.face.normal );
              rollOverPlane.position
              .divideScalar( BOX_SIZE )
              .floor()
              .multiplyScalar( BOX_SIZE )
              .addScalar( PIXEL_UNIT );
              rollOverPlane.position.y = 0;

              render();
  }

  function onMouseDown(event) {
    event.preventDefault();

    mouse.set( ( event.offsetX / windowWidth ) * 2 - 1,
              - ( event.offsetY / windowHeight ) * 2 + 1 );

              raycaster.setFromCamera( mouse, camera );

              const intersects = raycaster.intersectObjects(planeList);
              if (intersects.length === 0) {
                return;
              }

              const intersect = intersects[ 0 ];

              const position = new THREE.Vector3();

              position.copy( intersect.point ).add( intersect.face.normal );
              position
                .divideScalar( BOX_SIZE )
                .floor()
                .addScalar(1);

              stateLayer.rpc.move({
                id: stateLayer.store.me.id,
                x: position.x,
                y: position.y,
              });
  }

  htmlElement.addEventListener('mousemove', onMouseMove, false);
  htmlElement.addEventListener('mousedown', onMouseDown, false);
  window.addEventListener('resize', onWindowResize, false);

  function onWindowResize() {
    camera.left = container.offsetWidth / - 2;
    camera.right = container.offsetWidth / 2;
    camera.top = container.offsetHeight / 2;
    camera.bottom = container.offsetHeight / - 2;
    camera.updateProjectionMatrix()

    renderer.setSize( container.offsetWidth, container.offsetHeight )
  }

  let tokens = [];
  let token;

  let objects = {};
  token = stateLayer.store.on('create', function (obj) {
    if (obj.type === 'effect') {
      return effectManager.create('fire', obj.options.duration, obj.position);
    }

    var object = objects[obj.id] = new THREE.Group();
    const cube = new THREE.Mesh( geometry, material );
    object.add(cube);

    object.position.x = BOX_SIZE * obj.position.x -PIXEL_UNIT;
    object.position.z = BOX_SIZE * obj.position.y -PIXEL_UNIT;
    object.position.y = PIXEL_UNIT;

    object.lookAt(new THREE.Vector3(
      object.position.x + 1,
      object.position.y,
      object.position.z
    ));

    scene.add( object );
  });
  tokens.push(token);

  token = stateLayer.store.on('init', function () {
    const object = objects[this.me.id];
    camera.position.copy(object.position);
  });
  tokens.push(token);

  token = stateLayer.store.on('move', function (obj, to, from) {
    const object = objects[obj.id];

    // Rotate
    var pos = new THREE.Vector3();
    pos.x = BOX_SIZE * to.x - PIXEL_UNIT;
    pos.z = BOX_SIZE * to.y - PIXEL_UNIT;
    pos.y = object.position.y;
    object.lookAt(pos);

    // Move
    object.position.x = pos.x;
    object.position.z = pos.z;

    if (obj.id === this.me.id) {
      camera.position.copy(object.position);
    }
  });
  tokens.push(token);

  token = stateLayer.store.on('destroyAll', () => {
    Object.keys(objects).forEach(id => {
      const cube = objects[id];
      scene.remove(cube);
    });
    render();
    objects = {};
  });
  tokens.push(token);

  const planeGeometry = new THREE.PlaneGeometry(BOX_SIZE, BOX_SIZE);
  planeGeometry.rotateX( - Math.PI / 2 );
  planeGeometry.translate( PIXEL_UNIT, 0, PIXEL_UNIT );

  const planes = {};
  const planeList = [];

  token = stateLayer.store.on('terrain', terrain => {
    const { loc, color } = terrain;

    const key = `${loc.x}_${loc.y}`;

    let plane = planes[key];
    if (!plane) {
      const material = new THREE.MeshBasicMaterial({
        side: THREE.FrontSide,
      });
      plane = planes[key] = new THREE.Mesh(planeGeometry, material);
      planeList.push(plane);
      plane.position.x = (loc.x - 1) * BOX_SIZE;
      plane.position.z = (loc.y - 1) * BOX_SIZE;
      scene.add(plane);
    }
    plane.material.color.setHex(color);
  });
  tokens.push(token);

  token = stateLayer.store.on('voxels', ({ id, data }) => {
    const object = objects[id];
    for (let i = object.children.length - 1; i >= 0; --i) {
      const child = object.children[i];
      object.remove(child);
    }

    const result = data;
    const geometry = new THREE.Geometry();

    geometry.vertices.length = 0;
    geometry.faces.length = 0;
    for(var i = 0; i < result.vertices.length; ++i) {
      var q = result.vertices[i];
      geometry.vertices.push(new THREE.Vector3(q[0], q[1], q[2]));
    }
    for(var i = 0; i < result.faces.length; ++i) {
      const q = result.faces[i];
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
    surfacemesh.position.y = MINI_PIXEL_SIZE * -PIXEL_NUM / 2.0;// - PLANE_Y_OFFSET;
    surfacemesh.position.z = MINI_PIXEL_SIZE * -PIXEL_NUM / 2.0;
    surfacemesh.scale.set(MINI_PIXEL_SIZE, MINI_PIXEL_SIZE, MINI_PIXEL_SIZE);

    object.add(surfacemesh);
  });
  tokens.push(token);

    // Map
  const data = stateLayer.store.objects.getAllObjects();
  Object.keys(data).forEach(id => {
    const obj = data[id];

    const object = objects[obj.id] = new THREE.Group();
    const cube = new THREE.Mesh( geometry, material );
    object.add(cube);

    object.position.x = BOX_SIZE * obj.position.x -PIXEL_UNIT;
    object.position.z = BOX_SIZE * obj.position.y -PIXEL_UNIT;
    object.position.y = PIXEL_UNIT;

    object.lookAt(new THREE.Vector3(
      object.position.x + 1,
      object.position.y,
      object.position.z
    ));

    scene.add( object );
  });

  /////////////////////////////////////////////////////////////////////////
  // FIN
  /////////////////////////////////////////////////////////////////////////

  let time;
  let frameId;
  function update() {
    frameId = requestAnimationFrame(update);

    const now = new Date().getTime();
    const dt = now - (time || now);
    time = now;

    render(dt);
  }
  update();

  return {
    destroy() {
      htmlElement.removeEventListener('mousemove', onMouseMove, false);
      htmlElement.removeEventListener('mousedown', onMouseDown, false);
      window.removeEventListener('resize', onWindowResize, false);
      tokens.forEach(token => token.remove());
      cancelAnimationFrame(frameId);
    },
  };
}

const style = {
  width: '100%',
  height: '100%',
};

export interface MainProps extends React.Props<Main> {
  stateLayer: StateLayer;
}

export class Main extends React.Component<MainProps, {}> {
  canvas;

  componentDidMount() {
    this.canvas = initMainView(this.refs['canvas'], this.props.stateLayer);
  }

  componentWillUnmount() {
    this.canvas.destroy();
  }

  render() {
    return <div ref="canvas" style={style}></div>;
  }
};

export default Main;
