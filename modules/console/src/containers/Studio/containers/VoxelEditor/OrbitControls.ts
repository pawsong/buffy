import * as THREE from 'three';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/controls/OrbitControls');
}
