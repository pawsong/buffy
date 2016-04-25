import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import ZoneView from '../../canvas/ZoneView';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/effects/CardboardEffect');
  require('three/examples/js/controls/DeviceOrientationControls');
}

class CardboardZoneView extends ZoneView {
  private controls: any;
  camera: THREE.PerspectiveCamera;
  effect: any;

  constructor(container: HTMLElement, stateLayer: StateLayer) {
    super(container, stateLayer);
    this.effect = new THREE['CardboardEffect'](this.renderer);
    this.controls = new THREE['DeviceOrientationControls'](this.camera);
  }

  getCamera() {
    const camera = new THREE.PerspectiveCamera(90, this.container.offsetWidth / this.container.offsetHeight, 0.001, 700);
    // camera.position.set(0, 15, 0);
    camera.position.set(200, 200, 200);
    camera['focalLength'] = camera.position.distanceTo( this.scene.position );
    return camera;
  }

  handleWindowResize() {
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.effect.setSize(width, height);
  }

  render(dt = 0) {
    super.render(dt);
    this.controls.update();
    this.effect.render(this.scene, this.camera);
  }

  destroy() {
    super.destroy();
    this.controls.dispose();
  }
}

export default CardboardZoneView;
