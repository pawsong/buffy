import * as THREE from 'three';
import * as ndarray from 'ndarray';
const mapValues = require('lodash/mapValues');
const findLastIndex = require('lodash/findLastIndex');

import VoxelEditorTool from '../tools/VoxelEditorTool';
import createTool from '../tools';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/controls/OrbitControls');
}

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../../constants/Pixels';

import {
  rgbToHex,
} from '../utils';

import {
  ToolType,
  DispatchAction,
  ModelEditorState,
  GetEditorState,
} from '../../types';

import CanvasShared from '../shared';

const size = GRID_SIZE * UNIT_PIXEL;

var radius = 1600, theta = 270, phi = 60;

interface PlaneMesh extends THREE.Mesh {
  isPlane: boolean;
}

interface CanvasOptions {
  container: HTMLElement;
  canvasShared: CanvasShared;
  dispatchAction: DispatchAction;
  handleEditorStateChange: (nextState: ModelEditorState) => any;
  getEditorState: GetEditorState;
}


const gridVertexShader = require('raw!./grid.vert');
const gridFragmentShader = require('raw!./grid.frag');

class MainCanvas {
  scene: THREE.Scene;
  controls: any;

  frameId: number;
  renderer: THREE.WebGLRenderer;
  onWindowResize: () => any;
  removeListeners: () => any;
  container: HTMLElement;

  cachedTools: { [index: string]: VoxelEditorTool };
  handleEditorStateChange: any;
  dispatchAction: DispatchAction;
  getState: GetEditorState;

  interact: (event?: MouseEvent) => any;

  // Lazy getter
  getTool(toolType: ToolType): VoxelEditorTool {
    const tool = this.cachedTools[toolType];
    if (tool) return tool;

    return this.cachedTools[toolType] =
      createTool(toolType, this, this.getState, this.handleEditorStateChange, this.dispatchAction);
  }

  tool: VoxelEditorTool;

  constructor({
    container,
    canvasShared,
    dispatchAction,
    handleEditorStateChange,
    getEditorState,
  }: CanvasOptions) {
    this.dispatchAction = dispatchAction;
    this.getState = getEditorState;

    this.container = container;
    this.cachedTools = {};
    this.handleEditorStateChange = handleEditorStateChange;

    const scene = this.scene = new THREE.Scene();
    const raycaster = new THREE.Raycaster();

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

      const plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial() ) as PlaneMesh;
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

    const modelMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: gridVertexShader,
      fragmentShader: gridFragmentShader,
    });
    modelMaterial.extensions.derivatives = true;

    let surfacemesh: THREE.Mesh;
    let bufferGeometry: THREE.BufferGeometry;
    canvasShared.meshStore.listen(({ geometry }) => {
      if (surfacemesh) {
        // TODO: dispose geometry and material
        scene.remove(surfacemesh);
        surfacemesh = undefined;
      }

      if (bufferGeometry) bufferGeometry.dispose();

      if (geometry.vertices.length === 0) return;

      // Create geometry
      bufferGeometry = new THREE.BufferGeometry().fromGeometry(geometry);

      // Create mesh
      surfacemesh = new THREE.Mesh(bufferGeometry, modelMaterial);
      surfacemesh['isVoxel'] = true;
      surfacemesh['doubleSided'] = false;

      surfacemesh.position.x = BOX_SIZE * -GRID_SIZE / 2.0;
      surfacemesh.position.y = BOX_SIZE * -GRID_SIZE / 2.0 - PLANE_Y_OFFSET;
      surfacemesh.position.z = BOX_SIZE * -GRID_SIZE / 2.0;

      surfacemesh.scale.set(BOX_SIZE, BOX_SIZE, BOX_SIZE);

      scene.add(surfacemesh);
    });

    /////////////////////////////////////////////////////////////
    // INITIALIZE
    /////////////////////////////////////////////////////////////

    const renderer = this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

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

    const controls = this.controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.maxDistance = 2000;
    controls.enableKeys = false;

    // TODO: Lazy loading.
    this.tool = this.getTool(getEditorState().selectedTool);
    this.tool.onStart();

    const getIntersect = () => {
      const intersectable = scene.children.filter(object => this.tool.isIntersectable(object));
      const intersections = raycaster.intersectObjects(intersectable);
      return intersections[0];
    }

    const interact = (event?: any) => {
      var intersect = getIntersect();
      this.tool.onInteract({ intersect, event });
    }
    this.interact = interact;

    function render() {
      controls.update();
      canvasShared.cameraPositionStore.update([camera.position.x, camera.position.y, camera.position.z]);
      renderer.render(scene, camera);
    }

    this.onWindowResize = () => {
      camera.aspect = container.offsetWidth / container.offsetHeight
      camera.updateProjectionMatrix()
      canvasShared.cameraPositionStore.update([camera.position.x, camera.position.y, camera.position.z]);

      renderer.setSize( container.offsetWidth, container.offsetHeight )
      interact();
    }

    const mouse2D = new THREE.Vector3( 0, 10000, 0.5 )
    function onDocumentMouseMove(event) {
      event.preventDefault()

      mouse2D.set( ( event.offsetX / container.offsetWidth ) * 2 - 1,
                - ( event.offsetY / container.offsetHeight ) * 2 + 1 ,
                NaN);

      raycaster.setFromCamera( mouse2D, camera );
      interact(event);
    }

    const onDocumentMouseDown = (event) => {
      event.preventDefault()

      const intersect = getIntersect()
      this.tool.onMouseDown({ intersect, event });
    }

    const onDocumentMouseUp = (event) => {
      event.preventDefault();

      var intersect = getIntersect();
      this.tool.onMouseUp({ intersect, event });

      interact(event);
      render()
    }

    // Add event handlers
    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);
    window.addEventListener('resize', this.onWindowResize, false);

    this.removeListeners = () => {
      renderer.domElement.removeEventListener('mousemove', onDocumentMouseMove, false);
      renderer.domElement.removeEventListener('mousedown', onDocumentMouseDown, false);
      renderer.domElement.removeEventListener('mouseup', onDocumentMouseUp, false);
      window.removeEventListener('resize', this.onWindowResize, false);
    };

    const animate = () => {
      this.frameId = requestAnimationFrame( animate );
      render();
    }
    animate();
  }

  resize() {
    this.onWindowResize();
  }

  updateState(nextState: ModelEditorState) {
    if (this.tool.getToolType() !== nextState.selectedTool) {
      const nextTool = this.getTool(nextState.selectedTool);
      this.tool.onStop();
      this.tool = nextTool;
      this.tool.onStart();
    }
    this.tool.updateProps(nextState);
  }

  destroy() {
    // Destroy tools
    Object.keys(this.cachedTools).forEach(toolType => this.cachedTools[toolType].destroy());

    this.removeListeners();
    cancelAnimationFrame(this.frameId);
    this.renderer.forceContextLoss();
    this.renderer.context = null;
    this.renderer.domElement = null;
  }
}

export default MainCanvas;
