import EventEmitter from 'eventemitter3';

import { createEffectManager } from './effects';

const Promise = require('bluebird');

export default (htmlElement, store, api) => {
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
    - 500, 1000
  );
  camera.position.x = 200;
  camera.position.y = 200;
  camera.position.z = 200;

  const scene = new THREE.Scene();

  const effectManager = createEffectManager(scene);

  // Grid
  var line_material = new THREE.LineBasicMaterial( { color: 0x303030 } ),
    geometry = new THREE.Geometry(),
    floor = -75, step = 50;

  floor = 0;

  for ( var i = 0; i <= 40; i ++ ) {
    geometry.vertices.push( new THREE.Vector3( - 500, floor, i * step - 500 ) );
    geometry.vertices.push( new THREE.Vector3(   500, floor, i * step - 500 ) );

    geometry.vertices.push( new THREE.Vector3( i * step - 500, floor, -500 ) );
    geometry.vertices.push( new THREE.Vector3( i * step - 500, floor,  500 ) );
  }

  var line = new THREE.LineSegments( geometry, line_material );
  scene.add( line );

  // Tiles

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const planeGeo = new THREE.PlaneBufferGeometry( 1000, 1000 );
  planeGeo.rotateX( - Math.PI / 2 );

  const plane = new THREE.Mesh( planeGeo, new THREE.MeshBasicMaterial( { visible: false } ) );
  scene.add( plane );

  const rollOverPlaneGeo = new THREE.PlaneBufferGeometry( 50, 50 );
  rollOverPlaneGeo.rotateX( - Math.PI / 2 );
  const rollOverMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000, opacity: 0.5, transparent: true
  });
  const rollOverPlane = new THREE.Mesh( rollOverPlaneGeo, rollOverMaterial);
  scene.add( rollOverPlane );

  // Cubes

  var geometry = new THREE.BoxGeometry( 50, 50, 50 );
  var material = new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, overdraw: 0.5 } );

  // Lights

  var ambientLight = new THREE.AmbientLight( Math.random() * 0x10 );
  scene.add( ambientLight );

  var directionalLight = new THREE.DirectionalLight( Math.random() * 0xffffff );
  directionalLight.position.x = Math.random() - 0.5;
  directionalLight.position.y = Math.random() - 0.5;
  directionalLight.position.z = Math.random() - 0.5;
  directionalLight.position.normalize();
  scene.add( directionalLight );

  var directionalLight = new THREE.DirectionalLight( Math.random() * 0xffffff );
  directionalLight.position.x = Math.random() - 0.5;
  directionalLight.position.y = Math.random() - 0.5;
  directionalLight.position.z = Math.random() - 0.5;
  directionalLight.position.normalize();
  scene.add( directionalLight );
  //
  //scene.add( new THREE.AmbientLight( 0x444444 ) );

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
              .divideScalar( 50 )
              .floor()
              .multiplyScalar( 50 )
              .addScalar( 25 );
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
              console.log(intersect);

              const position = new THREE.Vector3();

              position.copy( intersect.point ).add( intersect.face.normal );
              position
              .divideScalar( 50 )
              .floor()
              .addScalar(1);

              api.move('', position.x, position.z);
  }, false);

  let cubes = {};
  store.on('create', obj => {
    if (obj.type === 'effect') {
      return effectManager.create('fire', obj.options.duration, obj.position);
    }

    var cube = cubes[obj.id] = new THREE.Mesh( geometry, material );

    cube.position.x = 50 * obj.position.x -25;
    cube.position.z = 50 * obj.position.y -25;
    cube.position.y = 25;

    scene.add( cube );
  });

  store.on('move', (obj, to, from) => {
    const cube = cubes[obj.id];
    cube.position.x = 50 * to.x -25;
    cube.position.z = 50 * to.y -25;
  });

  store.on('destroyAll', () => {
    Object.keys(cubes).forEach(id => {
      const cube = cubes[id];
      scene.remove(cube);
    });
    render();
    cubes = {};
  });

  // Map
  const objects = store.objects.getAllObjects();
  Object.keys(objects).forEach(id => {
    const obj = objects[id];

    var cube = cubes[obj.id] = new THREE.Mesh( geometry, material );
    cube.position.x = 50 * obj.position.x -25;
    cube.position.z = 50 * obj.position.y -25;
    cube.position.y = 25;
  });

  /////////////////////////////////////////////////////////////////////////
  // FIN
  /////////////////////////////////////////////////////////////////////////

  return {
    render,
  };
}
