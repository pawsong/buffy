import THREE from 'three';
import ndarray from 'ndarray';

import GreedyMesh from './meshers/greedy';
import CulledMesh from './meshers/culled';

import { vector3ToString } from '@pasta/helper-public';

import store, {
  actions,
  observeStore,
} from '../store';

import * as ActionTypes from '../constants/ActionTypes';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../constants/Pixels';

import VoxelManager from './VoxelManager';
import { toolsFactory } from './tools';

import {
  rgbToHex,
  voxelMapToArray,
} from './utils';

const size = GRID_SIZE * UNIT_PIXEL;

export function initCanvas(container, canvasSize) {
  const scene = new THREE.Scene();
  const voxels = new VoxelManager(scene, canvasSize || {
    width: GRID_SIZE,
    depth: GRID_SIZE,
    height: GRID_SIZE,
  });

  var radius = 1600, theta = 270, phi = 60;

  /////////////////////////////////////////////////////////////
  // INITIALIZE
  /////////////////////////////////////////////////////////////

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor( 0xffffff );
  renderer.setSize( container.offsetWidth, container.offsetHeight )

  // Hide ghost bottom margin
  renderer.domElement.style['vertical-align'] = 'bottom';
  container.appendChild(renderer.domElement)

  const camera = new THREE.PerspectiveCamera(
    40, container.offsetWidth / container.offsetHeight, 1, 10000
  );
  camera.position.x =
    radius * Math.cos(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360)
  camera.position.z =
    radius * Math.sin(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360)
  camera.position.y =
    radius * Math.sin(phi * Math.PI / 360);

  const controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.maxDistance = 2000;
  controls.enableKeys = false;

  let tool;
  function getIntersect() {
    const intersectable = scene.children.filter(tool.isIntersectable);
    const intersections = raycaster.intersectObjects(intersectable);
    return intersections[0];
  }

  function interact(event) {
    var intersect = getIntersect();

    tool.onInteract({
      intersect,
      event,
    });
  }

  function render() {
    controls.update();
    renderer.render(scene, camera);
  }

  const raycaster = new THREE.Raycaster();

  // Initialize tools
  const handlers = [
    'onEnter',
    'onInteract',
    'onMouseDown',
    'onMouseUp',
    'onLeave',
  ];

  const tools = _.mapValues(toolsFactory, factory => {
    const factories = factory instanceof Array ? factory : [factory];
    const instances = factories.map(f => f({
      container,
      scene,
      voxels,
      controls,
      interact,
      render,
    }));

    const tool = {};
    handlers.forEach(handler => {
      const funcs = instances
        .filter(inst => inst[handler])
        .map(inst => inst[handler].bind(inst));

      tool[handler] = (arg) => {
        funcs.forEach(func => func(arg));
      };
    });

    const isIntersectableIdx = _.findLastIndex(instances, instance => instance.isIntersectable);
    tool.isIntersectable = isIntersectableIdx >= 0 ?
      instances[isIntersectableIdx].isIntersectable :
      object => object.isVoxel || object.isPlane;

    return tool;
  });

  observeStore(state => state.tool, ({ type }) => {
    if (tool) {
      tool.onLeave();
    }
    tool = tools[type];

    if (tool) {
      tool.onEnter();
    } else {
      console.error(`Invalid tool type: ${type}`);
    }
  });

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

  // Arrows
  {
    const axisHelper = new THREE.AxisHelper(BOX_SIZE *  (GRID_SIZE+1));
    axisHelper.position.set(-size, PLANE_Y_OFFSET, -size);
    scene.add(axisHelper);
  }

  function onWindowResize() {
    camera.aspect = container.offsetWidth / container.offsetHeight
    camera.updateProjectionMatrix()

    renderer.setSize( container.offsetWidth, container.offsetHeight )
    interact();
  }

  // Add event handlers
  renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
  renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
  renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
  window.addEventListener('resize', onWindowResize, false);

  const mouse2D = new THREE.Vector3( 0, 10000, 0.5 )
  function onDocumentMouseMove(event) {
    event.preventDefault()

    mouse2D.set( ( event.offsetX / container.offsetWidth ) * 2 - 1,
              - ( event.offsetY / container.offsetHeight ) * 2 + 1 );

    raycaster.setFromCamera( mouse2D, camera );
    interact(event);
  }

  function onDocumentMouseDown(event) {
    event.preventDefault()

    const intersect = getIntersect()

    tool.onMouseDown({
      intersect,
    });
  }

  function onDocumentMouseUp(event) {
    event.preventDefault();

    var intersect = getIntersect();

    tool.onMouseUp({
      intersect,
      event,
    });

    interact(event);
    render()
  }

  function animate() {
    requestAnimationFrame( animate );
    render();
  }
  animate();

  let surfacemesh;
  let voxelData;

  function reloadVoxelData() {
    const { voxel } = store.getState();
    voxelData = voxelMapToArray(voxel);
  };
  reloadVoxelData();

  function updateVoxelMesh() {
    if (surfacemesh) {
      // TODO: dispose geometry and material
      scene.remove(surfacemesh.edges);
      scene.remove(surfacemesh);
      surfacemesh = undefined;
    }

    // TODO: Lazy meshing
    const mesher = GreedyMesh;
    //const mesher = CulledMesh;
    const result = mesher(voxelData.data, voxelData.shape);

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
    var material  = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
      shading: THREE.FlatShading,
    });
    surfacemesh = new THREE.Mesh( geometry, material );
    surfacemesh.isVoxel = true;
    surfacemesh.doubleSided = false;
    surfacemesh.position.x = BOX_SIZE * -GRID_SIZE / 2.0;
    surfacemesh.position.y = BOX_SIZE * -GRID_SIZE / 2.0 - PLANE_Y_OFFSET;
    surfacemesh.position.z = BOX_SIZE * -GRID_SIZE / 2.0;
    surfacemesh.scale.set(BOX_SIZE, BOX_SIZE, BOX_SIZE);
    scene.add(surfacemesh);

    surfacemesh.edges = new THREE.EdgesHelper(surfacemesh, 0x000000);
    scene.add(surfacemesh.edges);
  }

  observeStore(state => state.voxelOp, op => {
    switch(op.type) {
      case ActionTypes.ADD_VOXEL_BATCH:
        {
          op.voxels.forEach(voxel => {
            const { position, color } = voxel;
            voxelData.set(position.z - 1, position.y - 1, position.x - 1, rgbToHex(color));
          });
          updateVoxelMesh();
          break;
        }
      case ActionTypes.REMOVE_VOXEL:
        {
          const { position } = op.voxel;
          voxelData.set(position.z - 1, position.y - 1, position.x - 1, 0);
          updateVoxelMesh();
          break;
        }
      case ActionTypes.LOAD_WORKSPACE:
        reloadVoxelData();
        updateVoxelMesh();
        break;
    }
  });

}
