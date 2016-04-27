import * as THREE from 'three';
import * as ndarray from 'ndarray';
const mapValues = require('lodash/mapValues');
const findLastIndex = require('lodash/findLastIndex');

import { GridFace } from '../meshers/greedy';

import vector3ToString from '@pasta/helper/lib/vector3ToString';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../../constants/Pixels';

import { toolsFactory } from '../tools';

import {
  rgbToHex,
  voxelMapToArray,
} from '../utils';

import {
  Services,
  ToolType,
  DispatchAction,
  VoxelEditorState,
  GetEditorState,
  EditorStateListener,
  EditorStateSelector,
  EditorStateObserver,
  ObserveEditorState,
} from '../../interface';

import CanvasShared from '../shared';

const size = GRID_SIZE * UNIT_PIXEL;

var radius = 1600, theta = 270, phi = 60;

// Initialize tools
const handlers = [
  'onEnter',
  'onInteract',
  'onMouseDown',
  'onMouseUp',
  'onLeave',
];

interface PlaneMesh extends THREE.Mesh {
  isPlane: boolean;
}

interface CanvasOptions {
  container: HTMLElement;
  canvasShared: CanvasShared;
  dispatchAction: DispatchAction;
  handleEditorStateChange: (nextState: VoxelEditorState) => any;
  getEditorState: GetEditorState;
}

export default class MainCanvas {
  editorStateListeners: EditorStateListener[];
  frameId: number;
  renderer: THREE.WebGLRenderer;
  onWindowResize: () => any;
  removeListeners: () => any;

  constructor({
    container,
    canvasShared,
    dispatchAction,
    handleEditorStateChange,
    getEditorState,
  }: CanvasOptions) {
    const scene = new THREE.Scene();
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

    let surfacemesh;
    canvasShared.meshStore.listen(({ geometry, gridFaces }) => {
      if (surfacemesh) {
        // TODO: dispose geometry and material
        scene.remove(surfacemesh.edges);
        scene.remove(surfacemesh);
        surfacemesh = undefined;
      }

      if (geometry.vertices.length === 0) return;

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

      gridFaces.forEach(gridFace => {
        const gridGeometry = new THREE.Geometry();
        const vertices = [];

        const { d, c } = gridFace;
        const u = (d+1)%3;
        const v = (d+2)%3;

        for (let i = 1; i < gridFace.w; ++i) {
          const vertex0 = new Array(3);
          vertex0[d] = gridFace.origin[d];
          vertex0[u] = gridFace.origin[u] + i;
          vertex0[v] = gridFace.origin[v];

          const vertex1 = new Array(3);
          vertex1[d] = gridFace.origin[d];
          vertex1[u] = gridFace.origin[u] + i;
          vertex1[v] = gridFace.origin[v] + gridFace.h;

          gridGeometry.vertices.push(new THREE.Vector3(vertex0[0], vertex0[1], vertex0[2]));
          gridGeometry.vertices.push(new THREE.Vector3(vertex1[0], vertex1[1], vertex1[2]));
        }

        for (let i = 1; i < gridFace.h; ++i) {
          const vertex0 = new Array(3);
          vertex0[d] = gridFace.origin[d];
          vertex0[u] = gridFace.origin[u];
          vertex0[v] = gridFace.origin[v] + i;

          const vertex1 = new Array(3);
          vertex1[d] = gridFace.origin[d];
          vertex1[u] = gridFace.origin[u] + gridFace.w;
          vertex1[v] = gridFace.origin[v] + i;

          gridGeometry.vertices.push(new THREE.Vector3(vertex0[0], vertex0[1], vertex0[2]));
          gridGeometry.vertices.push(new THREE.Vector3(vertex1[0], vertex1[1], vertex1[2]));
        }

        const r = (c >> 16) & 0xff;  // extract red
        const g = (c >>  8) & 0xff;  // extract green
        const b = (c >>  0) & 0xff;  // extract blue

        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
        const color = luma < 40 ? 0xffffff : 0x000000;

        const line = new THREE.LineSegments(gridGeometry, new THREE.LineBasicMaterial({
          color, linewidth: 1,
        }));
        surfacemesh.add(line);
      });
    });

    /////////////////////////////////////////////////////////////
    // INITIALIZE
    /////////////////////////////////////////////////////////////

    const renderer = this.renderer = new THREE.WebGLRenderer({ antialias: true });
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

    function interact(event?: any) {
      var intersect = getIntersect();

      tool.onInteract({
        intersect,
        event,
      });
    }

    function render() {
      controls.update();
      canvasShared.cameraPositionStore.update(camera.position);
      renderer.render(scene, camera);
    }

    this.editorStateListeners = [];

    const observeEditorState: ObserveEditorState = (selector: EditorStateSelector<any>, observer: EditorStateObserver<any>) => {
      let state;

      const listener = (editorState: VoxelEditorState) => {
        const nextState = selector(editorState);
        if (state !== nextState) {
          observer(nextState);
        }
      };
      this.editorStateListeners.push(listener);

      listener(getEditorState());

      return () => {
        const index = this.editorStateListeners.indexOf(listener);
        if (index !== -1) this.editorStateListeners.splice(index, 1);
      };
    };

    const services: Services = {
      container,
      scene,
      controls,
      interact,
      dispatchAction,
      handleEditorStateChange,
      getEditorState,
      observeEditorState,
    };

    const tools = mapValues(toolsFactory, factory => {
      const factories = factory instanceof Array ? factory : [factory];
      const instances = factories.map(f => f(services));

      const tool: any = {};
      handlers.forEach(handler => {
        const funcs = instances
          .filter(inst => inst[handler])
          .map(inst => inst[handler].bind(inst));

        tool[handler] = (arg) => {
          funcs.forEach(func => func(arg));
        };
      });

      const isIntersectableIdx = findLastIndex(instances, (instance: {
        isIntersectable: boolean;
      }) => instance.isIntersectable);
      tool.isIntersectable = isIntersectableIdx >= 0 ?
        instances[isIntersectableIdx].isIntersectable :
        object => object.isVoxel || object.isPlane;

      return tool;
    });

    const unsubscribe = observeEditorState(editorState => editorState.selectedTool, selectedTool => {
      if (tool) {
        tool.onLeave();
      }
      tool = tools[selectedTool];

      if (tool) {
        tool.onEnter();
      } else {
        console.error(`Invalid tool type: ${ToolType[selectedTool]}`);
      }
    });

    this.onWindowResize = () => {
      camera.aspect = container.offsetWidth / container.offsetHeight
      camera.updateProjectionMatrix()
      canvasShared.cameraPositionStore.update(camera.position);

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

  updateState(nextState: VoxelEditorState) {
    this.editorStateListeners.forEach(listener => listener(nextState));
  }

  destroy() {
    this.removeListeners();
    cancelAnimationFrame(this.frameId);
    this.renderer.forceContextLoss();
    this.renderer.context = null;
    this.renderer.domElement = null;
  }
}
