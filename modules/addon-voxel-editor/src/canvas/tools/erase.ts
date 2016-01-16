import * as THREE from 'three';
import Voxel, { VoxelMesh } from '../Voxel';

import Fsm from '../../Fsm';

import store, {
  actions,
} from '../../store';

import highlightVoxel from './highlightVoxel';

import vector3ToString from '@pasta/helper/lib/vector3ToString';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../../constants/Pixels';

import {
  toAbsPos,
  toScreenPos,
} from '../utils';

const cube = new THREE.CubeGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
const cubeMaterial = new THREE.MeshBasicMaterial({
  vertexColors: THREE.VertexColors,
  opacity: 0.5,
  transparent: true,
  polygonOffset: true,
  polygonOffsetFactor: -0.1,
});

export default [
  ({
    scene,
    container,
    interact,
    render,
    controls,
  }) => {
    const cursor = new Voxel(scene);

    const State = {
      IDLE: 'IDLE',
      ROTATE: 'ROTATE',
      DRAG: 'DRAG',
    };

    const fsm = new Fsm(State.IDLE, {
      [State.IDLE]: {
        isIntersectable(object) {
          return object.isVoxel;
        },

        onMouseDown({
          intersect,
        }) {
          if (intersect) {
            return this.transition(State.DRAG, intersect);
          } else {
            return this.transition(State.ROTATE);
          }
        },

        onInteract({
          intersect,
        }) {
          cursor.hide();

          if (!intersect) { return; }
          if (!intersect.object.isVoxel) { return; }

          const normal = intersect.face.normal;
          const position = new THREE.Vector3().subVectors( intersect.point, normal )
          cursor.move({
            x: Math.floor( position.x / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
            y: Math.floor( position.y / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
            z: Math.floor( position.z / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
          });
        },

        onLeave() {
          cursor.hide();
        },
      },

      [State.DRAG]: {
        isIntersectable(object) {
          return object.isVoxel;
        },

        onEnter(intersect) {
          controls.enableRotate = false;
          this._selected = {};
          this.onInteract({ intersect });
        },

        onInteract({
          intersect,
        }) {
          if (!intersect) { return; }
          if (!intersect.object.isVoxel) { return; }

          const normal = intersect.face.normal;
          const position = new THREE.Vector3().subVectors( intersect.point, normal )

          const screenPos = {
            x: Math.floor( position.x / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
            y: Math.floor( position.y / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
            z: Math.floor( position.z / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
          };

          const key = vector3ToString(screenPos);
          if (this._selected[key]) { return; }

          const mesh = new THREE.Mesh(cube, cubeMaterial) as VoxelMesh;
          mesh.position.copy(screenPos as THREE.Vector3);
          mesh.overdraw = false;
          scene.add(mesh);

          this._selected[key] = {
            position: toAbsPos(screenPos),
            mesh: mesh,
          };
        },

        onMouseUp({
          intersect,
        }) {
          const voxels = Object.keys(this._selected)
            .map(key => ({ position: this._selected[key].position }));
          actions.removeVoxels(voxels);

          this.transition(State.IDLE);
        },

        onLeave() {
          controls.enableRotate = true;
          Object.keys(this._selected).forEach(key => {
            const { position, mesh } = this._selected[key];
            scene.remove(mesh);
          });
          this._selected = undefined;
        },
      },

      [State.ROTATE]: {
        onMouseUp() {
          this.transition(State.IDLE);
        },
      },
    }, {
      isIntersectable() {},
      onMouseDown() {},
      onInteract() {},
      onMouseUp() {},
    });

    return {
      onEnter() {
        fsm.start();
      },

      isIntersectable(object) {
        return fsm.current.isIntersectable(object);
      },

      onMouseDown(args) {
        return fsm.current.onMouseDown(args);
      },

      onInteract(args) {
        return fsm.current.onInteract(args);
      },

      onMouseUp(args) {
        return fsm.current.onMouseUp(args);
      },

      onLeave() {
        fsm.stop();
      },
    };
  },
]
