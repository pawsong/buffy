import THREE from 'three';
import EventEmitter from 'eventemitter3';

import { createEffectManager } from './effects';

const Promise = require('bluebird');

const PIXEL_NUM = 16;

const PIXEL_UNIT = 32;
const BOX_SIZE = PIXEL_UNIT * 2;

const MINI_PIXEL_SIZE = BOX_SIZE / PIXEL_NUM;

const GRID_SIZE = BOX_SIZE * 10;

export default (htmlElement, store, api) => {
  const windowWidth = htmlElement.offsetWidth;
  const windowHeight = htmlElement.offsetHeight;

  /////////////////////////////////////////////////////////////////////////
  // Init
  /////////////////////////////////////////////////////////////////////////

  /*
  const camera = new THREE.PerspectiveCamera(
    40, windowWidth / windowHeight, 1, 10000
  );
  */

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

  // Grid
  var line_material = new THREE.LineBasicMaterial( { color: 0x303030 } ),
    geometry = new THREE.Geometry(),
    step = BOX_SIZE;

  const floor = 0;

  for ( var i = 0; i <= 40; i ++ ) {
    geometry.vertices.push( new THREE.Vector3( - GRID_SIZE, floor, i * step - GRID_SIZE ) );
    geometry.vertices.push( new THREE.Vector3(   GRID_SIZE, floor, i * step - GRID_SIZE ) );

    geometry.vertices.push( new THREE.Vector3( i * step - GRID_SIZE, floor, -GRID_SIZE ) );
    geometry.vertices.push( new THREE.Vector3( i * step - GRID_SIZE, floor,  GRID_SIZE ) );
  }

  var line = new THREE.LineSegments( geometry, line_material );
  scene.add( line );

  // Tiles

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const planeGeo = new THREE.PlaneBufferGeometry( 2 * GRID_SIZE, 2 * GRID_SIZE );
  planeGeo.rotateX( - Math.PI / 2 );

  const plane = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial( { visible: false } ) );
  scene.add( plane );

  const rollOverPlaneGeo = new THREE.PlaneBufferGeometry( BOX_SIZE, BOX_SIZE );
  rollOverPlaneGeo.rotateX( - Math.PI / 2 );
  const rollOverMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000, opacity: 0.5, transparent: true
  });
  const rollOverPlane = new THREE.Mesh( rollOverPlaneGeo, rollOverMaterial);
  scene.add( rollOverPlane );

  // Cubes

  var geometry = new THREE.BoxGeometry( BOX_SIZE, BOX_SIZE, BOX_SIZE );
  var material = new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, overdraw: 0.5 } );

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

  htmlElement.addEventListener('mousemove', event => {
    event.preventDefault();

    mouse.set( ( event.offsetX / windowWidth ) * 2 - 1,
              - ( event.offsetY / windowHeight ) * 2 + 1 );

              raycaster.setFromCamera( mouse, camera );

              const intersects = raycaster.intersectObjects([ plane ]);
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
  }, false);

  htmlElement.addEventListener('mousedown', event => {
    event.preventDefault();

    mouse.set( ( event.offsetX / windowWidth ) * 2 - 1,
              - ( event.offsetY / windowHeight ) * 2 + 1 );

              raycaster.setFromCamera( mouse, camera );

              const intersects = raycaster.intersectObjects([ plane ]);
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

              api.move('', position.x, position.z);
  }, false);

  let objects = {};
  store.on('create', obj => {
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

  store.on('move', (obj, to, from) => {
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
  });

  store.on('destroyAll', () => {
    Object.keys(objects).forEach(id => {
      const cube = objects[id];
      scene.remove(cube);
    });
    render();
    objects = {};
  });

  store.on('voxels', ({ id, data }) => {
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
      shading: THREE.FlatShading,
    });
    const surfacemesh = new THREE.Mesh( geometry, material );
    surfacemesh.doubleSided = false;
    surfacemesh.position.x = MINI_PIXEL_SIZE * -PIXEL_NUM / 2.0;
    surfacemesh.position.y = MINI_PIXEL_SIZE * -PIXEL_NUM / 2.0;// - PLANE_Y_OFFSET;
    surfacemesh.position.z = MINI_PIXEL_SIZE * -PIXEL_NUM / 2.0;
    surfacemesh.scale.set(MINI_PIXEL_SIZE, MINI_PIXEL_SIZE, MINI_PIXEL_SIZE);

    object.add(surfacemesh);
  });

  // Map
  //const data = store.objects.getAllObjects();
  //Object.keys(data).forEach(id => {
  //  const obj = objects[id];

  //  var cube = cubes[obj.id] = new THREE.Mesh( geometry, material );
  //  cube.position.x = BOX_SIZE * obj.position.x -PIXEL_UNIT;
  //  cube.position.z = BOX_SIZE * obj.position.y -PIXEL_UNIT;
  //  cube.position.y = PIXEL_UNIT;
  //});

  /////////////////////////////////////////////////////////////////////////
  // FIN
  /////////////////////////////////////////////////////////////////////////

  return {
    render,
  };
}
