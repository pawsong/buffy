import THREE from 'three';
import store, {
  actions,
  observeStore,
} from '../../store';

import {
  GRID_SIZE,
  UNIT_PIXEL,
  BOX_SIZE,
  DIMENSIONS,
  PLANE_Y_OFFSET,
} from '../../constants/Pixels';

import Voxel from '../Voxel';

const cube = new THREE.CubeGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);

const State = {
  IDLE: 'IDLE',
  ROTATE: 'ROTATE',
  DRAW: 'DRAW',
};

export default [
  ({
    container,
    scene,
    voxels,
    controls,
    interact,
    render,
    setIntersectFilter,
  }) => {
    const brush = new Voxel(scene);
    brush.mesh.isBrush = true;

    observeStore(state => state.color, (color) => {
      brush.mesh.material.color.setStyle(`rgb(${color.r},${color.g},${color.b})`);
    });

    let drawGuideMeshes = [];
    let selectedMeshes = [];

    function addDrawGuideMesh(absPos, prevMesh) {
      const position = voxels.toScreenPos(absPos);
      const material = new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors,
        opacity: 0,
        transparent: true,
      });
      material.color.copy(brush.mesh.material.color);

      const mesh = new THREE.Mesh(cube, material);
      mesh.visible = true;
      mesh.overdraw = false;
      mesh.position.copy(position);
      mesh.isDrawGuide = true;
      scene.add(mesh);

      const wireMesh = new THREE.EdgesHelper(mesh, 0x000000);
      wireMesh.visible = false;
      wireMesh.material.transparent = true;
      wireMesh.material.opacity = 0.8;
      scene.add(wireMesh);

      mesh.wireMesh = wireMesh;
      mesh.prev = prevMesh;
      drawGuideMeshes.push(mesh);
      return mesh;
    }

    function resetDrawGuideMeshes() {
      drawGuideMeshes.forEach(mesh => {
        scene.remove(mesh);
        scene.remove(mesh.wireMesh);
      });
      drawGuideMeshes = [];
    }

    let state;

    return {
      onEnter() {
        state = State.IDLE;
      },

      isIntersectable(object) {
        if (state === State.DRAW) {
          return object.isDrawGuide;
        } else {
          return object.isVoxel || object.isPlane;
        }
      },

      onMouseDown({
        intersect,
      }) {
        if (!intersect) {
          state = State.ROTATE;
          return;
        }

        if (brush.isVisible()) {
          state = State.DRAW;
          controls.enableRotate = false;

          const absPos = voxels.toAbsPos(brush.position);

          let prev;
          const center = addDrawGuideMesh(absPos);

          prev = center;
          for (let i = absPos.x - 1; i >= 1; --i) {
            prev = addDrawGuideMesh({
              x: i, y: absPos.y, z: absPos.z,
            }, prev);
          }
          prev = center;
          for (let i = absPos.x + 1; i <= voxels.maxX; ++i) {
            prev = addDrawGuideMesh({
              x: i, y: absPos.y, z: absPos.z,
            }, prev);
          }

          prev = center;
          for (let i = absPos.y - 1; i >= 1; --i) {
            prev = addDrawGuideMesh({
              x: absPos.x, y: i, z: absPos.z,
            }, prev);
          }
          prev = center;
          for (let i = absPos.y + 1; i <= voxels.maxY; ++i) {
            prev = addDrawGuideMesh({
              x: absPos.x, y: i, z: absPos.z,
            }, prev);
          }

          prev = center;
          for (let i = absPos.z; i >= 1; --i) {
            prev = addDrawGuideMesh({
              x: absPos.x, y: absPos.y, z: i,
            }, prev);
          }
          prev = center;
          for (let i = absPos.z + 1; i <= voxels.maxZ; ++i) {
            prev = addDrawGuideMesh({
              x: absPos.x, y: absPos.y, z: i,
            }, prev);
          }

          selectedMeshes = [center];
        }
      },

      onInteract({
        intersect,
        event,
      }) {
        brush.hide();
        if (state === State.ROTATE) { return; }

        if (!intersect) {
          return;
        }

        if (state === State.IDLE) {
          var normal = intersect.face.normal;
          var position = new THREE.Vector3().addVectors( intersect.point, normal )

          brush.move({
            x: Math.floor( position.x / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
            y: Math.floor( position.y / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
            z: Math.floor( position.z / (UNIT_PIXEL * 2) ) * UNIT_PIXEL * 2 + UNIT_PIXEL,
          });
        } else {
          selectedMeshes.forEach(object => {
            object.material.opacity = 0;
            object.wireMesh.visible = false;
          });
          selectedMeshes = [];

          let object = intersect.object;
          while(object) {
            object.material.opacity = 0.5;
            object.wireMesh.visible = true;

            selectedMeshes.push(object);
            object = object.prev;
          }
        }
      },

      onMouseUp({
        intersect,
        event,
      }) {
        controls.enableRotate = true;
        state = State.IDLE;

        const { color } = store.getState();
        actions.addVoxels(selectedMeshes.map(mesh => ({
          color,
          position: voxels.toAbsPos(mesh.position),
        })));

        resetDrawGuideMeshes();

        // Test interact after voxel is added.
        setTimeout(() => {
          interact(event);
          render();
        }, 0);
      },

      onLeave() {
        controls.enableRotate = true;
        brush.hide();
      },
    };
  },
]
