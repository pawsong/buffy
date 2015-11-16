import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import store, {
  actions,
  observeStore,
} from './store';

import Controls from './components/controls';

import * as ActionTypes from './constants/ActionTypes';

const GRID_SIZE = 16;
const UNIT_PIXEL = 25;
const BOX_SIZE = UNIT_PIXEL * 2;
const PLANE_Y_OFFSET = - BOX_SIZE * 4;

function toScreenPosition(absPos) {
  return {
    x: absPos.x * BOX_SIZE - (GRID_SIZE - 1) * UNIT_PIXEL,
    z: GRID_SIZE * BOX_SIZE - absPos.y * BOX_SIZE - (GRID_SIZE + 1) * UNIT_PIXEL,
    y: absPos.z * BOX_SIZE + UNIT_PIXEL + PLANE_Y_OFFSET,
  };
}

function toAbsolutePosition(screenPos) {
  return {
    x: (screenPos.x + (GRID_SIZE - 1) * UNIT_PIXEL) / BOX_SIZE,
    y: GRID_SIZE - (screenPos.z + (GRID_SIZE + 1) * UNIT_PIXEL) / BOX_SIZE,
    z: (screenPos.y - PLANE_Y_OFFSET - UNIT_PIXEL) / BOX_SIZE,
  };
}

export default (container, parent, submit /* TODO: Replace with ajax call */) => {
  require('./OrbitControls');

  var controls;
  var camera, renderer, brush
  var projector, plane, scene, grid
  var mouse2D, mouse3D, raycaster, objectHovered
  var isShiftDown = false, isCtrlDown = false, isMouseDown = false, isAltDown = false
  var onMouseDownPosition = new THREE.Vector2(), onMouseDownPhi = 60, onMouseDownTheta = 45
  var radius = 1600, theta = 90, phi = 60
  var target = new THREE.Vector3( 0, 200, 0 )
  var color = 0
  var CubeMaterial = THREE.MeshBasicMaterial
  var cube = new THREE.CubeGeometry( 50, 50, 50 )
  var wireframeCube = new THREE.CubeGeometry(50.5, 50.5 , 50.5)
  var wireframe = true, fill = true
  var wireframeOptions = { color: 0x000000, wireframe: true, wireframeLinewidth: 1, opacity: 0.8 }
  var colors = ['2ECC71', '3498DB', '34495E', 'E67E22', 'ECF0F1'].map(function(c) { return hex2rgb(c) })

  init()

  function addVoxel(x, y, z, c) {
    var cubeMaterial = new CubeMaterial( { vertexColors: THREE.VertexColors, transparent: true } )
    var col = colors[c] || colors[0]
    //cubeMaterial.color.setHex(c);
    cubeMaterial.color.setStyle(`rgba(${c.r},${c.g},${c.b},${c.a})`);

    var voxel = new THREE.Mesh( cube, cubeMaterial )
    //voxel.wireMesh =  new THREE.EdgesHelper( voxel, 0x4DEB90 );
    voxel.wireMesh =  new THREE.EdgesHelper( voxel, 0x303030 );
    voxel.isVoxel = true
    voxel.position.x = x
    voxel.position.y = y
    voxel.position.z = z
    voxel.wireMesh.position.copy(voxel.position)
    voxel.wireMesh.visible = wireframe
    voxel.matrixAutoUpdate = false
    voxel.updateMatrix()
    voxel.name = x + "," + y + "," + z
    voxel.overdraw = true
    scene.add( voxel )
    scene.add( voxel.wireMesh )
  }

  function v2h(value) {
    value = parseInt(value).toString(16)
    return value.length < 2 ? '0' + value : value
  }

  function rgb2hex(rgb) {
    return v2h( rgb[ 0 ] * 255 ) + v2h( rgb[ 1 ] * 255 ) + v2h( rgb[ 2 ] * 255 );
  }

  function hex2rgb(hex) {
    if(hex[0]=='#') hex = hex.substr(1)
    return [parseInt(hex.substr(0,2), 16)/255, parseInt(hex.substr(2,2), 16)/255, parseInt(hex.substr(4,2), 16)/255]
  }

  function scale( x, fromLow, fromHigh, toLow, toHigh ) {
    return ( x - fromLow ) * ( toHigh - toLow ) / ( fromHigh - fromLow ) + toLow
  }

  function init() {
    scene = new THREE.Scene()
    //scene.fog = new THREE.Fog( 0xffffff, 1, 10000 );

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xffffff );
    //renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( parent.offsetWidth, parent.offsetHeight )

    // Hide ghost bottom margin
    renderer.domElement.style['vertical-align'] = 'bottom';
    container.appendChild(renderer.domElement)

    camera = new THREE.PerspectiveCamera( 40, parent.offsetWidth / parent.offsetHeight, 1, 10000 )
    camera.position.x =
      radius * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 )
    camera.position.z =
      radius * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 )
    camera.position.y =
      radius * Math.sin( phi * Math.PI / 360 );
    //

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    //controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
    //controls.enableDamping = true;
    //controls.dampingFactor = 0.25;
    //controls.enableZoom = false;
    controls.maxDistance = 2000;

    // Grid
    var size = GRID_SIZE * UNIT_PIXEL;

    var geometry = new THREE.Geometry()
    for ( let i = -size; i <= size; i += BOX_SIZE ) {
      geometry.vertices.push(new THREE.Vector3(-size, PLANE_Y_OFFSET, i))
      geometry.vertices.push(new THREE.Vector3( size, PLANE_Y_OFFSET, i))

      geometry.vertices.push(new THREE.Vector3(i, PLANE_Y_OFFSET, -size))
      geometry.vertices.push(new THREE.Vector3(i, PLANE_Y_OFFSET,  size))
    }

    var material = new THREE.LineBasicMaterial({
      color: 0xdddddd, linewidth: 2,
    });
    var line = new THREE.LineSegments( geometry, material );
    scene.add( line )

    // Plane
    raycaster = new THREE.Raycaster();

    const planeGeometry = new THREE.PlaneGeometry( size * 2, size * 2 );
    planeGeometry.rotateX( - Math.PI / 2 );

    plane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial() )
    plane.position.y = PLANE_Y_OFFSET;
    //    plane.rotation.x = - Math.PI / 2
    //plane.visible = false
    plane.isPlane = true
    scene.add( plane )
    //plane.material.color.setHex( 0xffff00 );

    mouse2D = new THREE.Vector3( 0, 10000, 0.5 )

    // Brush
    var brushMaterial = new CubeMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
    });
    brushMaterial.color.setRGB(colors[0][0], colors[0][1], colors[0][2]);
    brush = new THREE.Mesh( cube, brushMaterial );

    brush.isBrush = true
    brush.position.y = 2000
    brush.overdraw = false
    scene.add( brush )

    const edges = new THREE.EdgesHelper( brush, 0x000000 );
    scene.add(edges);

    // Lights

    var ambientLight = new THREE.AmbientLight( 0x606060 )
    scene.add( ambientLight )

    var directionalLight = new THREE.DirectionalLight( 0xffffff );
		directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
		scene.add( directionalLight );

    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false )
    renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false )
    renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false )

    window.addEventListener( 'resize', onWindowResize, false )
  }

  function onWindowResize() {

    camera.aspect = parent.offsetWidth / parent.offsetHeight
    camera.updateProjectionMatrix()

    renderer.setSize( parent.offsetWidth, parent.offsetHeight )
    interact()
  }

  function getIntersecting() {
    var intersectable = []
    scene.children.map(function(c) { if (c.isVoxel || c.isPlane) intersectable.push(c); })
    var intersections = raycaster.intersectObjects( intersectable )
    if (intersections.length > 0) {
      var intersect = intersections[ 0 ].object.isBrush ? intersections[ 1 ] : intersections[ 0 ]
      return intersect
    }
  }

  function interact() {
    if (typeof raycaster === 'undefined') return

    if ( objectHovered ) {
      objectHovered.material.opacity = 1
      objectHovered = null
    }

    var intersect = getIntersecting()

    if ( intersect ) {
      var normal = intersect.face.normal.clone()
      //normal.applyMatrix4( intersect.object.matrixRotationWorld )
      var position = new THREE.Vector3().addVectors( intersect.point, normal )

      function updateBrush() {
        brush.position.x =
          Math.floor( position.x / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL;
        brush.position.y =
          Math.floor( position.y / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL;
        brush.position.z =
          Math.floor( position.z / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL;
      }
      return updateBrush();
    }
    brush.position.y = 2000
  }

  function onDocumentMouseMove( event ) {
    event.preventDefault()

    mouse2D.set( ( event.offsetX / parent.offsetWidth ) * 2 - 1,
              - ( event.offsetY / parent.offsetHeight ) * 2 + 1 );

    raycaster.setFromCamera( mouse2D, camera );

    interact()
  }

  function onDocumentMouseDown( event ) {
    event.preventDefault()
    isMouseDown = true
    onMouseDownTheta = theta
    onMouseDownPhi = phi
    onMouseDownPosition.x = event.clientX
    onMouseDownPosition.y = event.clientY
  }

  function onDocumentMouseUp( event ) {
    event.preventDefault()
    isMouseDown = false
    onMouseDownPosition.x = event.clientX - onMouseDownPosition.x
    onMouseDownPosition.y = event.clientY - onMouseDownPosition.y

    if ( onMouseDownPosition.length() > 5 ) return

    var intersect = getIntersecting()

    if ( intersect ) {
      if ( isShiftDown ) {
        if ( intersect.object != plane ) {
          scene.remove( intersect.object.wireMesh )
          scene.remove( intersect.object )
        }
      } else {
        if (brush.position.y != 2000) {
          const absPos = toAbsolutePosition(brush.position);
          actions.addVoxel(absPos, store.getState().color);
        }
      }
    }

    render()
    interact()
  }

  // https://gist.github.com/665235

  function render(dt) {
    //    camera.lookAt( target )
    // required if controls.enableDamping = true, or if controls.autoRotate = true
    controls.update();

    // camera.lookAt( scene.position )
    renderer.render( scene, camera )
  }

  function initUI() {
    const uiElement = document.createElement('div');
    container.appendChild(uiElement);
    uiElement.style.width = '100%';

    function onSubmit() {
      // Get token and submit!
      const state = store.getState();
      submit(state.voxel.toArray());
    }

    ReactDOM.render(
      <Provider store={store}>
        <Controls submit={submit}/>
      </Provider>,
      uiElement
    );
  }

  initUI();

  observeStore(state => state.voxelOp, op => {
    switch(op.type) {
      case ActionTypes.ADD_VOXEL:
        const { position, color } = op.voxel;
        const screenPos = toScreenPosition(position);
        addVoxel(screenPos.x, screenPos.y, screenPos.z, color);
        break;
    }
  });

  return { render };
}
