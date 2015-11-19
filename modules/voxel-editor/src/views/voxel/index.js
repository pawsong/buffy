import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { vector3ToString } from '@pasta/helper-public';

import store, {
  actions,
  observeStore,
} from '../../store';

import Controls from '../../components/Controls';

import * as ActionTypes from '../../constants/ActionTypes';

import shapeCarve from '../../shapeCarve';
import greedyMesh from '../../greedyMesh';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS
} from '../../constants/Pixels';

const PLANE_Y_OFFSET = - BOX_SIZE * 4;

function toScreenPosition(absPos) {
  return {
    x: absPos.y * BOX_SIZE - UNIT_PIXEL - GRID_SIZE / 2 * BOX_SIZE,
    z: absPos.x * BOX_SIZE - UNIT_PIXEL - GRID_SIZE / 2 * BOX_SIZE,
    y: absPos.z * BOX_SIZE - UNIT_PIXEL + PLANE_Y_OFFSET,
  };
}

function toAbsolutePosition(screenPos) {
  return {
    x: GRID_SIZE / 2 + (screenPos.z + UNIT_PIXEL) / BOX_SIZE,
    y: GRID_SIZE / 2 + (screenPos.x + UNIT_PIXEL) / BOX_SIZE,
    z: (screenPos.y - PLANE_Y_OFFSET + UNIT_PIXEL) / BOX_SIZE,
  };
}

export default (container, parent) => {
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

  /////////////////////////////////////////////////////////////
  // INITIALIZE
  /////////////////////////////////////////////////////////////

  const scene = new THREE.Scene()

  const renderer = new THREE.WebGLRenderer();
  renderer.setClearColor( 0xffffff );
  //renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( parent.offsetWidth, parent.offsetHeight )

  // Hide ghost bottom margin
  renderer.domElement.style['vertical-align'] = 'bottom';
  container.appendChild(renderer.domElement)

  const camera = new THREE.PerspectiveCamera( 40, parent.offsetWidth / parent.offsetHeight, 1, 10000 )
  camera.position.x =
    radius * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 )
  camera.position.z =
    radius * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 )
  camera.position.y =
    radius * Math.sin( phi * Math.PI / 360 );
  //

  const controls = new THREE.OrbitControls( camera, renderer.domElement );
  //controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
  //controls.enableDamping = true;
  //controls.dampingFactor = 0.25;
  //controls.enableZoom = false;
  controls.maxDistance = 2000;

  const raycaster = new THREE.Raycaster();

  const size = GRID_SIZE * UNIT_PIXEL;

  // Grid
  {
    const geometry = new THREE.Geometry()
    for ( let i = -size; i <= size; i += BOX_SIZE ) {
      geometry.vertices.push(new THREE.Vector3(-size, PLANE_Y_OFFSET, i))
      geometry.vertices.push(new THREE.Vector3( size, PLANE_Y_OFFSET, i))

      geometry.vertices.push(new THREE.Vector3(i, PLANE_Y_OFFSET, -size))
      geometry.vertices.push(new THREE.Vector3(i, PLANE_Y_OFFSET,  size))
    }

    const material = new THREE.LineBasicMaterial({
      color: 0xdddddd, linewidth: 2,
    });
    const line = new THREE.LineSegments(geometry, material );
    scene.add( line )
  }

  // Plane
  const plane = (() => {
    const geometry = new THREE.PlaneGeometry( size * 2, size * 2 );
    geometry.rotateX( - Math.PI / 2 );

    const plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial() )
    plane.position.y = PLANE_Y_OFFSET;
    plane.isPlane = true
    scene.add( plane )
    return plane;
  })();

  // Brush
  const brush = (() => {
    const brushMaterial = new CubeMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
    });
    brushMaterial.color.setRGB(colors[0][0], colors[0][1], colors[0][2]);
    const brush = new THREE.Mesh( cube, brushMaterial );

    brush.isBrush = true
    brush.position.y = 2000
    brush.overdraw = false
    scene.add( brush )

    const edges = new THREE.EdgesHelper( brush, 0x000000 );
    scene.add(edges);
    return brush;
  })();

  // Lights
  var ambientLight = new THREE.AmbientLight( 0x606060 )
  scene.add( ambientLight )

  var directionalLight = new THREE.DirectionalLight( 0xffffff );
  directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
  scene.add( directionalLight );

  // Add event handlers
  renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false )
  renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false )
  renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false )

  window.addEventListener( 'resize', onWindowResize, false )

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

  function hex2rgb(hex) {
    if(hex[0]=='#') hex = hex.substr(1)
    return [parseInt(hex.substr(0,2), 16)/255, parseInt(hex.substr(2,2), 16)/255, parseInt(hex.substr(4,2), 16)/255]
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

  let objectHovered;
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

  const mouse2D = new THREE.Vector3( 0, 10000, 0.5 )
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

  function render(dt) {
    controls.update();
    renderer.render(scene, camera);
  }

  observeStore(state => state.voxelOp, op => {
    switch(op.type) {
      case ActionTypes.ADD_VOXEL:
        const { position, color } = op.voxel;
        const screenPos = toScreenPosition(position);
        addVoxel(screenPos.x, screenPos.y, screenPos.z, color);
        break;
    }
  });

  /////////////////////////////////////////////////////////////
  // SPRITE FOCUS
  /////////////////////////////////////////////////////////////

  const yAxisGeometry = new THREE.BoxGeometry(GRID_SIZE * BOX_SIZE, BOX_SIZE, BOX_SIZE);
  const zAxisGeometry = new THREE.BoxGeometry(BOX_SIZE, GRID_SIZE * BOX_SIZE, BOX_SIZE);
  const xAxisGeometry = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, GRID_SIZE * BOX_SIZE);
  const focusMaterial = new THREE.MeshBasicMaterial( {color: 0x00ff00} );

  let focusMesh;

  function clearSpriteFocus() {
    if (focusMesh) {
      scene.remove(focusMesh);
      focusMesh = null;
    }
  }

  function addSpriteFocus(focus) {
    clearSpriteFocus();

    if (focus.x === 0) {
      focusMesh = new THREE.Mesh(xAxisGeometry, focusMaterial);
      focusMesh.position.copy(toScreenPosition({
        x: (GRID_SIZE + 1) / 2,
        y: focus.y,
        z: focus.z,
      }));
    } else if (focus.y === 0) {
      focusMesh = new THREE.Mesh(yAxisGeometry, focusMaterial);
      focusMesh.position.copy(toScreenPosition({
        x: focus.x,
        y: (GRID_SIZE + 1) / 2,
        z: focus.z,
      }));
    } else if (focus.z === 0) {
      focusMesh = new THREE.Mesh(zAxisGeometry, focusMaterial);
      focusMesh.position.copy(toScreenPosition({
        x: focus.x,
        y: focus.y,
        z: (GRID_SIZE + 1) / 2
      }));
    }

    if (!focusMesh) { return; }
    scene.add(focusMesh);
  }

  observeStore(state => state.spriteFocus, focus => {
    if (!focus) {
      return clearSpriteFocus();
    }
    addSpriteFocus(focus);
  });

  /////////////////////////////////////////////////////////////
  // VOXELS FROM SPRITES
  /////////////////////////////////////////////////////////////

  const renderSpriteMesh = (() => {
    let surfacemesh;
    return function renderSpriteMesh() {
      const { volume, dims } = shapeCarve(DIMENTIONS, store.getState().sprite, 0, [
        false, false, false, false, false, false,
      ]);

      const { vertices, faces } = greedyMesh(volume, dims);
      if (vertices.length === 0) { return; }

      // IMPORT START
      if(surfacemesh) {
        scene.remove( surfacemesh );
      }

      const geometry  = new THREE.Geometry();

      geometry.vertices.length = 0;
      geometry.faces.length = 0;
      for(let i = 0; i < vertices.length; ++i) {
        var q = vertices[i];
        geometry.vertices.push(new THREE.Vector3(q[0], q[1], q[2]));
      }
      for(var i = 0; i < faces.length; ++i) {
        var q = faces[i];
        var f = new THREE.Face3(q[0], q[1], q[2]);
        f.color = new THREE.Color(q[3]);
        f.vertexColors = [f.color,f.color,f.color];
        geometry.faces.push(f);
      }

      geometry.verticesNeedUpdate = true;
      geometry.elementsNeedUpdate = true;

      // Create surface mesh
      var material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        vertexColors: THREE.VertexColors,
        shading: THREE.FlatShading,
      });

      surfacemesh = new THREE.Mesh( geometry, material );
      surfacemesh.doubleSided = false;
      surfacemesh.position.x = BOX_SIZE * -dims[0] / 2.0;
      surfacemesh.position.y = BOX_SIZE * -dims[1] / 2.0 - PLANE_Y_OFFSET;
      surfacemesh.position.z = BOX_SIZE * -dims[2] / 2.0;
      surfacemesh.scale = BOX_SIZE;

      scene.add( surfacemesh );
      // IMPORT END
      return;
    }
  })();

  let surfacemesh;
  observeStore(state => state.spriteOp, op => {
    const { volume, dims } = shapeCarve(DIMENSIONS, store.getState().sprite, 0, [
      false, false, false, false, false, false,
    ]);

    const { vertices, faces } = greedyMesh(volume, dims);
    if (vertices.length === 0) { return; }

    // IMPORT START
    if(surfacemesh) {
      scene.remove( surfacemesh );
    }

    const geometry  = new THREE.Geometry();

    geometry.vertices.length = 0;
    geometry.faces.length = 0;
    for(let i = 0; i < vertices.length; ++i) {
      var q = vertices[i];
      geometry.vertices.push(new THREE.Vector3(q[0], q[1], q[2]));
    }
    for(var i = 0; i < faces.length; ++i) {
      var q = faces[i];
      var f = new THREE.Face3(q[0], q[1], q[2]);
      f.color = new THREE.Color(q[3]);
      f.vertexColors = [f.color,f.color,f.color];
      geometry.faces.push(f);
    }

    geometry.verticesNeedUpdate = true;
    geometry.elementsNeedUpdate = true;

    // Create surface mesh
    var material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
      shading: THREE.FlatShading,
    });

    surfacemesh = new THREE.Mesh( geometry, material );
    surfacemesh.doubleSided = false;
    surfacemesh.position.x = BOX_SIZE * -dims[0] / 2.0;
    surfacemesh.position.y = BOX_SIZE * -dims[1] / 2.0 - PLANE_Y_OFFSET;
    surfacemesh.position.z = BOX_SIZE * -dims[2] / 2.0;
    surfacemesh.scale.set(BOX_SIZE, BOX_SIZE, BOX_SIZE);
    surfacemesh.isVoxel = true;

    scene.add( surfacemesh );
  });


  /////////////////////////////////////////////////////////////
  // RETURN REDNER FUNCTION
  /////////////////////////////////////////////////////////////
  return { render };
}
