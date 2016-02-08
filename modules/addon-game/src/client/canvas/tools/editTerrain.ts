import { ToolStateFactory } from '../interface';
import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../../Constants';

const factory: ToolStateFactory = ({
  container,
  stateLayer,
  scene,
  camera,
  raycaster,
  terrainManager,
}) => {
  const rollOverPlaneGeo = new THREE.PlaneBufferGeometry( BOX_SIZE, BOX_SIZE );
  rollOverPlaneGeo.rotateX(- Math.PI / 2);

  const rollOverMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    opacity: 0.5,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -0.1,
  });

  const rollOverPlane = new THREE.Mesh(rollOverPlaneGeo, rollOverMaterial);
  scene.add(rollOverPlane);

  const mouse = new THREE.Vector2();

  function onMouseMove(event) {
    event.preventDefault();

    mouse.set(
      (event.offsetX / container.offsetWidth) * 2 - 1,
      -(event.offsetY / container.offsetHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(terrainManager.terrains);
    if (intersects.length === 0) { return; }

    const intersect = intersects[0];

    rollOverPlane.position.copy(intersect.point).add(intersect.face.normal);
    rollOverPlane.position
      .divideScalar(BOX_SIZE)
      .floor()
      .multiplyScalar(BOX_SIZE)
      .addScalar(PIXEL_UNIT);

    rollOverPlane.position.y = 0;
  }

  function onMouseDown(event) {
    event.preventDefault();

    const position = new THREE.Vector3();
    position.copy(rollOverPlane.position)
      .divideScalar(BOX_SIZE)
      .floor()
      .addScalar(1);

    stateLayer.rpc.updateTerrain({
      x: position.x,
      z: position.z,
      color: 0x00ff00,
    });
  }

  return {
    onEnter() {
      container.addEventListener('mousemove', onMouseMove, false);
      container.addEventListener('mousedown', onMouseDown, false);
    },

    onLeave() {
      container.removeEventListener('mousemove', onMouseMove, false);
      container.removeEventListener('mousedown', onMouseDown, false);
    },

    onDestroy() {
      rollOverPlaneGeo.dispose();
      rollOverMaterial.dispose();
    },
  };
};

export default factory;
