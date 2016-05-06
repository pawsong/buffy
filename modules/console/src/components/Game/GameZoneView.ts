import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import DesignManager from '../../DesignManager';
import ZoneView from '../../ZoneView';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/effects/CardboardEffect');
  require('three/examples/js/controls/MouseControls');
}

class GameZoneView extends ZoneView {
  private controls: any;
  camera: THREE.PerspectiveCamera;

  constructor(container: HTMLElement, stateLayer: StateLayer, designManager: DesignManager) {
    super(container, stateLayer, designManager);
    this.controls = new THREE['MouseControls'](this.camera);
  }

  getCamera() {
    const camera = new THREE.PerspectiveCamera(90, this.container.offsetWidth / this.container.offsetHeight, 0.001, 700);
    // camera.position.set(0, 15, 0);
    return camera;
  }

  handleWindowResize() {
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  render(dt = 0) {
    super.render(dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    super.destroy();
    this.controls.dispose();
  }
}

export default GameZoneView;
